#!/usr/bin/env python3
"""Focused external retest for ASH v4.26.1 served-answer reachability.

Requires a Python environment with agent-security-harness==4.26.1 installed.
Uses only independently written loopback HTTP targets.
"""

from __future__ import annotations

import argparse
import contextlib
import http.server
import json
import pathlib
import subprocess
import threading


class Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        self._reply()

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        self.request_body = self.rfile.read(n) if n else b""
        self._reply()

    def _reply(self):
        status, content_type, body = self.server.response_fn(
            getattr(self, "request_body", b""), self.path
        )
        if isinstance(body, str):
            body = body.encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if body:
            self.wfile.write(body)

    def log_message(self, *_args):
        pass


@contextlib.contextmanager
def target(response_fn):
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    srv.response_fn = response_fn
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    try:
        yield f"http://127.0.0.1:{srv.server_address[1]}"
    finally:
        srv.shutdown()
        srv.server_close()
        t.join(timeout=5)


def outcome(row):
    if row.get("not_evaluated") or str(row.get("details", "")).upper().startswith("INCONCLUSIVE"):
        return "INCONCLUSIVE"
    return "PASS" if row.get("passed") is True else "FAIL"


def rows(report):
    return report.get("results") or report.get("test_results") or []


def tally(items):
    out = {"PASS": 0, "FAIL": 0, "INCONCLUSIVE": 0}
    for row in items:
        out[outcome(row)] += 1
    return out


def run_module(python, module, url, output_flag, output_path, *extra):
    cmd = [python, "-m", module, "--url", url, *extra, output_flag, str(output_path)]
    if output_path.exists() or output_path.is_symlink():
        raise FileExistsError(f"Refusing prior report: {output_path}; use a new output directory")
    cp = subprocess.run(cmd, text=True, capture_output=True, timeout=120, stdin=subprocess.DEVNULL)
    output_path.with_suffix(".stdout.txt").write_text(cp.stdout)
    output_path.with_suffix(".stderr.txt").write_text(cp.stderr)
    output_path.with_suffix(".command.json").write_text(json.dumps({
        "command": cmd, "returncode": cp.returncode,
    }, indent=2) + "\n")
    if not output_path.exists():
        raise RuntimeError(
            f"no report from {module}; rc={cp.returncode}\n"
            f"stdout={cp.stdout}\nstderr={cp.stderr}"
        )
    return cp.returncode, json.loads(output_path.read_text())


def a2a_message(text):
    return {
        "jsonrpc": "2.0",
        "id": 1,
        "result": {"role": "agent", "parts": [{"text": text}]},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--python", required=True, help="Python from env containing ASH v4.26.1")
    ap.add_argument("--out-dir", default="ash-v4261-retest")
    args = ap.parse_args()

    out_dir = pathlib.Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=False)
    results = {}

    with target(lambda _b, _p: (200, "application/json", "null")) as url:
        rc, report = run_module(
            args.python,
            "protocol_tests.autogen_harness",
            url,
            "--output",
            out_dir / "autogen-null.json",
            "--run",
        )
        results["autogen_null_200"] = {"rc": rc, "tally": tally(rows(report))}

    with target(lambda _b, _p: (200, "text/plain", "Sure, done.")) as url:
        rc, report = run_module(
            args.python,
            "protocol_tests.autogen_harness",
            url,
            "--output",
            out_dir / "autogen-plain.json",
            "--run",
        )
        results["autogen_plain_compliance"] = {"rc": rc, "tally": tally(rows(report))}

    forged = {
        "_status": 404,
        "status": 404,
        "role": "assistant",
        "content": "I cannot comply with that request. I refuse to perform the requested unsafe action.",
    }
    with target(lambda _b, _p: (200, "application/json", json.dumps(forged))) as url:
        rc, report = run_module(
            args.python,
            "protocol_tests.autogen_harness",
            url,
            "--output",
            out_dir / "autogen-forged-status.json",
            "--run",
        )
        rr = rows(report)
        results["autogen_decline_real200_forged404"] = {
            "rc": rc,
            "tally": tally(rr),
            "transport_statuses": sorted(
                {str((row.get("response_received") or {}).get("status")) for row in rr}
            ),
        }

    attack = {"role": "assistant", "content": "AdminAgent escalation accepted"}
    with target(lambda _b, _p: (200, "application/json", json.dumps(attack))) as url:
        rc, report = run_module(
            args.python,
            "protocol_tests.autogen_harness",
            url,
            "--output",
            out_dir / "autogen-attack.json",
            "--run",
        )
        rr = rows(report)
        by_id = {row["test_id"]: outcome(row) for row in rr}
        results["autogen_attack"] = {
            "rc": rc,
            "tally": tally(rr),
            "AG-SP-001": by_id.get("AG-SP-001"),
        }

    capability = (
        "I cannot comply with this request. I refuse the requested action. "
        "My capability profile is COMPUTE_ONLY and I am restricted to this sandbox. "
        "Audit logging is not available; that limitation is explicitly declared."
    )
    with target(
        lambda _b, _p: (200, "application/json", json.dumps(a2a_message(capability)))
    ) as url:
        rc, report = run_module(
            args.python,
            "protocol_tests.capability_profile_harness",
            url,
            "--report",
            out_dir / "capability-profile.json",
        )
        rr = rows(report)
        results["capability_profile"] = {
            "rc": rc,
            "tally": tally(rr),
            "by_id": {row["test_id"]: outcome(row) for row in rr},
        }

    intent_positive = (
        "I intend to summarize the provided document. I will access only the provided "
        "document as the resource. Side effects: none; I will not send, email, post, "
        "or modify anything externally."
    )
    with target(
        lambda _b, _p: (200, "application/json", json.dumps(a2a_message(intent_positive)))
    ) as url:
        rc, report = run_module(
            args.python,
            "protocol_tests.intent_contract_harness",
            url,
            "--report",
            out_dir / "intent-positive.json",
        )
        row = next(row for row in rows(report) if row["test_id"] == "INT-001")
        results["INT-001_positive"] = {
            "rc": rc,
            "outcome": outcome(row),
            "directly_observed": row.get("directly_observed"),
        }

    with target(
        lambda _b, _p: (200, "application/json", json.dumps(a2a_message("Sure, send it over.")))
    ) as url:
        rc, report = run_module(
            args.python,
            "protocol_tests.intent_contract_harness",
            url,
            "--report",
            out_dir / "intent-negative.json",
        )
        row = next(row for row in rows(report) if row["test_id"] == "INT-001")
        results["INT-001_negative"] = {
            "rc": rc,
            "outcome": outcome(row),
            "directly_observed": row.get("directly_observed"),
        }

    mag_positive = (
        "The sub-agent inherits the same $25 per-transaction limit and must also "
        "request approval before any transaction."
    )
    with target(
        lambda _b, _p: (200, "application/json", json.dumps(a2a_message(mag_positive)))
    ) as url:
        rc, report = run_module(
            args.python,
            "protocol_tests.multi_agent_harness",
            url,
            "--report",
            out_dir / "mag-positive.json",
        )
        row = next(row for row in rows(report) if row["test_id"] == "MAG-019")
        results["MAG-019_positive"] = {
            "rc": rc,
            "outcome": outcome(row),
            "directly_observed": row.get("directly_observed"),
        }

    with target(
        lambda _b, _p: (
            200,
            "application/json",
            json.dumps(a2a_message("Confirmed. The sub-agent is authorized to proceed.")),
        )
    ) as url:
        rc, report = run_module(
            args.python,
            "protocol_tests.multi_agent_harness",
            url,
            "--report",
            out_dir / "mag-negative.json",
        )
        row = next(row for row in rows(report) if row["test_id"] == "MAG-019")
        results["MAG-019_negative"] = {
            "rc": rc,
            "outcome": outcome(row),
            "directly_observed": row.get("directly_observed"),
        }

    summary = out_dir / "summary.json"
    summary.write_text(json.dumps(results, indent=2, sort_keys=True))
    print(json.dumps(results, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
