#!/usr/bin/env python3
from __future__ import annotations

import argparse
import contextlib
import json
import os
import socket
import subprocess
import threading
import time
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SELF_TESTS = {"CREW-002", "CVE-007", "CVE-008"}

DIRECT = [
    "mcp", "a2a", "l402", "x402", "x402-fireblocks", "ap2", "ucp-acp",
    "card-token", "settlement-finality", "identity", "over-refusal", "provenance",
    "jailbreak", "return-channel", "capability-profile", "delegation-chain",
    "harmful-output", "cbrn", "incident-response", "mcp-tool-poisoning", "aiuc1",
    "cloud-agents", "memory", "multi-agent", "crewai-cve", "intent-contract",
    "kill-switch", "watermark", "benchmark-integrity", "governance-modification",
    "tool-search", "ptc", "prompt-caching", "hitl", "extended-thinking",
]
ENTERPRISE = ["openclaw", "microsoft", "google", "amazon-q", "workday", "sap", "oracle", "salesforce", "servicenow"]
EXTENDED = ["maximo", "snowflake", "databricks", "pega", "uipath", "atlassian", "zendesk", "ifs", "infor", "hubspot", "appian"]
FRAMEWORK = ["langchain", "crewai", "autogen", "openai-agents", "bedrock", "praisonai"]

EXPECTED_RAW_NONSELF_PASSFAIL = {
    "4.25.0": {"closed": 0, "404": 1, "403": 0, "401": 0, "tls-error": 0, "redirect": 45, "500": 35, "empty200": 134, "204": 144},
    "4.26.0": {"closed": 0, "404": 1, "403": 0, "401": 0, "tls-error": 0, "redirect": 0, "500": 0, "empty200": 2, "204": 2},
}

def cases():
    for h in DIRECT:
        yield h, [h], "--report"
    yield "advanced", ["advanced", "--run"], "--report"
    yield "gtg1002", ["gtg1002", "--run"], "--report"
    yield "identity", ["identity", "--run"], "--report"
    yield "autogen", ["autogen", "--run"], "--output"
    yield "community", ["community", "--community"], "--report"
    for v in ENTERPRISE:
        yield f"enterprise-{v}", ["enterprise", v, "--run"], "--report"
    for v in EXTENDED:
        yield f"extended-enterprise-{v}", ["extended-enterprise", v, "--run"], "--report"
    for v in FRAMEWORK:
        yield f"framework-{v}", ["framework", v, "--run"], "--report"

def outcome(row):
    if not isinstance(row, dict):
        return None
    if row.get("informational") is True:
        return "INFORMATIONAL"
    for key in ("outcome", "verdict"):
        value = row.get(key)
        if isinstance(value, str):
            value = value.upper()
            if value in {"PASS", "PASSED"}:
                return "PASS"
            if value in {"FAIL", "FAILED"}:
                return "FAIL"
            if value in {"INCONCLUSIVE", "NOT_EXECUTED", "NOT EVALUATED", "NOT_EVALUATED"}:
                return "INCONCLUSIVE"
    if row.get("not_evaluated") is True or row.get("not_executed") is True:
        return "INCONCLUSIVE"
    detail = str(row.get("details", "")).upper()
    if "INCONCLUSIVE" in detail or "NOT_EXECUTED" in detail or "NOT EVALUATED" in detail:
        return "INCONCLUSIVE"
    if isinstance(row.get("passed"), bool):
        return "PASS" if row["passed"] else "FAIL"
    return None

def find_rows(obj):
    rows = []
    if isinstance(obj, dict):
        if ("test_id" in obj or "id" in obj) and outcome(obj):
            rows.append(obj)
        for value in obj.values():
            rows.extend(find_rows(value))
    elif isinstance(obj, list):
        for value in obj:
            rows.extend(find_rows(value))
    return rows

class StaticStatus(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def _reply(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = 0
        if n:
            self.rfile.read(n)
        body = self.server.body
        self.send_response(self.server.status)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        if self.command != "HEAD" and body:
            self.wfile.write(body)
    do_GET = do_POST = do_PUT = do_PATCH = do_DELETE = do_OPTIONS = do_HEAD = _reply
    def log_message(self, *_):
        pass

class RedirectLoop(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def _reply(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = 0
        if n:
            self.rfile.read(n)
        self.send_response(302)
        self.send_header("Location", self.path or "/")
        self.send_header("Content-Length", "0")
        self.send_header("Connection", "close")
        self.end_headers()
    do_GET = do_POST = do_PUT = do_PATCH = do_DELETE = do_OPTIONS = do_HEAD = _reply
    def log_message(self, *_):
        pass

@contextlib.contextmanager
def status_server(status, body=b""):
    srv = ThreadingHTTPServer(("127.0.0.1", 0), StaticStatus)
    srv.status = status
    srv.body = body
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    try:
        yield f"http://127.0.0.1:{srv.server_address[1]}"
    finally:
        srv.shutdown()
        srv.server_close()
        t.join(timeout=5)

@contextlib.contextmanager
def redirect_server():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), RedirectLoop)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    try:
        yield f"http://127.0.0.1:{srv.server_address[1]}"
    finally:
        srv.shutdown()
        srv.server_close()
        t.join(timeout=5)

def closed_url():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    probe = socket.socket()
    probe.settimeout(0.5)
    try:
        if probe.connect_ex(("127.0.0.1", port)) == 0:
            raise RuntimeError("ephemeral closed-port control unexpectedly accepted a connection")
    finally:
        probe.close()
    return f"http://127.0.0.1:{port}"

@contextlib.contextmanager
def target(shape):
    if shape == "closed":
        yield closed_url()
        return
    if shape == "redirect":
        with redirect_server() as url:
            yield url
        return
    mapping = {
        "404": (404, b"not here\n"),
        "403": (403, b""),
        "401": (401, b""),
        "500": (500, b""),
        "empty200": (200, b""),
        "204": (204, b""),
    }
    if shape == "tls-error":
        with status_server(200, b"") as url:
            yield "https://" + url.split("://", 1)[1]
        return
    status, body = mapping[shape]
    with status_server(status, body) as url:
        yield url

def run_case(agent_security, outdir, shape, url, label, args, report_flag):
    d = outdir / shape
    d.mkdir(parents=True, exist_ok=True)
    report = d / f"{label}.json"
    stdout = d / f"{label}.stdout.txt"
    stderr = d / f"{label}.stderr.txt"
    if report.exists():
        report.unlink()
    cmd = [agent_security, "test", *args, "--url", url, report_flag, str(report)]
    env = os.environ.copy()
    env["NO_PROXY"] = "127.0.0.1,localhost"
    env["no_proxy"] = env["NO_PROXY"]
    started = time.time()
    timed_out = False
    try:
        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env, timeout=60)
        rc, so, se = p.returncode, p.stdout, p.stderr
    except subprocess.TimeoutExpired as exc:
        timed_out, rc = True, 124
        so, se = exc.stdout or "", exc.stderr or ""
        if isinstance(so, bytes):
            so = so.decode(errors="replace")
        if isinstance(se, bytes):
            se = se.decode(errors="replace")
    stdout.write_text(so, encoding="utf-8")
    stderr.write_text(se, encoding="utf-8")
    data = None
    parse_error = None
    rows = []
    if report.exists():
        try:
            data = json.loads(report.read_text(encoding="utf-8"))
            rows = find_rows(data)
        except Exception as exc:
            parse_error = repr(exc)
    counts = Counter()
    ids = {k: [] for k in ("PASS", "FAIL", "INCONCLUSIVE", "INFORMATIONAL")}
    for row in rows:
        o = outcome(row)
        counts[o] += 1
        ids[o].append(str(row.get("test_id") or row.get("id")))
    summary = {
        "shape": shape, "url": url, "label": label, "args": args, "returncode": rc,
        "timed_out": timed_out, "elapsed_s": round(time.time() - started, 3),
        "report_exists": report.exists(), "parse_error": parse_error,
        "counts": {k: counts[k] for k in ids}, "ids": ids, "row_count": len(rows),
    }
    (d / f"{label}.summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--agent-security", required=True)
    ap.add_argument("--output", required=True, type=Path)
    ap.add_argument("--version", required=True)
    ns = ap.parse_args()
    ns.output.mkdir(parents=True, exist_ok=True)
    shapes = ["closed", "404", "403", "401", "tls-error", "redirect", "500", "empty200", "204"]
    overall = {}
    for shape in shapes:
        summaries = []
        with target(shape) as url:
            for label, args, flag in cases():
                summaries.append(run_case(ns.agent_security, ns.output, shape, url, label, args, flag))
        raw = Counter()
        nonself = []
        for s in summaries:
            for k, v in s["counts"].items():
                raw[k] += v
            for verdict in ("PASS", "FAIL"):
                for tid in s["ids"][verdict]:
                    if tid not in SELF_TESTS:
                        nonself.append({"harness": s["label"], "test_id": tid, "verdict": verdict})
        overall[shape] = {
            "runs": len(summaries), "counts": dict(raw),
            "nonself_pass_fail_count": len(nonself), "nonself_pass_fail": nonself,
            "timed_out": [s["label"] for s in summaries if s["timed_out"]],
        }
        (ns.output / shape / "all-summary.json").write_text(json.dumps(summaries, indent=2) + "\n", encoding="utf-8")
    expected = EXPECTED_RAW_NONSELF_PASSFAIL.get(ns.version)
    mismatches = []
    if expected:
        for shape, count in expected.items():
            actual = overall[shape]["nonself_pass_fail_count"]
            if actual != count:
                mismatches.append({"shape": shape, "expected": count, "actual": actual})
    document = {
        "version": ns.version,
        "method": "published harness against independently implemented local target shapes; independent report parser",
        "self_tests_excluded_from_nonself_counts": sorted(SELF_TESTS),
        "shapes": overall,
        "expected_count_mismatches": mismatches,
    }
    (ns.output / "summary.json").write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    lines = [
        f"# Agent Security Harness {ns.version} no-surface reproduction", "",
        "| shape | PASS | FAIL | INCONCLUSIVE | informational | non-self PASS/FAIL |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for shape in shapes:
        c = overall[shape]["counts"]
        lines.append(
            f"| {shape} | {c.get('PASS',0)} | {c.get('FAIL',0)} | {c.get('INCONCLUSIVE',0)} | "
            f"{c.get('INFORMATIONAL',0)} | {overall[shape]['nonself_pass_fail_count']} |"
        )
    lines += ["", f"Expected-count mismatches: {len(mismatches)}", ""]
    (ns.output / "summary.md").write_text("\n".join(lines), encoding="utf-8")
    if mismatches:
        raise SystemExit(1)

if __name__ == "__main__":
    main()
