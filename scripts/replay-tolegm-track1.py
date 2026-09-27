#!/usr/bin/env python3
"""Project-side replay of tolegm's pinned Track 1 report; no automatic downloads.

Reads explicit frozen source, document and submission directories. Verifies
all bytes before running the fixed, reviewed commands. Does not edit inputs.
This execution is NOT an additional independent evaluation.
"""
import argparse
import copy
import hashlib
import json
import os
import platform
import subprocess
import sys
from pathlib import Path

SOURCE = {
    "lib/trust-engine.js": "60c8d7e26fa0a352401b391015618c56b9be39d59c4b7cc4d5b24ec3f8d726c2",
    "public/verification-packet.json": "87ff8f3784f7509e05ae19bc8f72236f061bff32ce79777c65343ac56609b54f",
    "lib/challenge-receipt.js": "21b8f565ee6155b7eec93e3fa490506f66453cfed7fb2b3c19eea8d4f0f4229e",
}
DOCUMENTS = {
    "docs/EXTERNAL_VERIFICATION_CHALLENGE.md": "69fa599256d546cd833ecd1515e0a1b9efb2a10796766758c523a37b994d037c",
    "protocol/external-verification-challenge-v1.json": "0bc4667eb94e71f2879b99489bbf999bff85ba401d5fce4d3860cbeac29c229e",
}
# The manifest is itself pinned below; no target-controlled expected hashes.
MANIFEST_SHA256 = "bd5ec5ed5f9888252a4a54edb91a4111bbdf32da13bccd2dd7e53d30d8325d91"
CASES = {"forged-verdict", "parameter-swap", "nonce-replay", "correlated-quorum", "evidence-deletion", "silent-monitor"}
EXPECTED_KEYS = {(case, mode) for case in CASES for mode in ("CLEAN", "TAMPERED")}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def verify(root, paths):
    for path, expected in paths.items():
        file = root / path
        if not file.is_file() or file.is_symlink() or sha(file.read_bytes()) != expected:
            raise ValueError(f"Missing or hash-mismatched input: {file}")


def strict_compare(left, right):
    for rows in (left, right):
        if not isinstance(rows, list) or len(rows) != 12:
            raise ValueError("Expected exactly twelve rows")
        keys = [(r["case_id"], r["mode"]) for r in rows]
        if len(set(keys)) != 12 or set(keys) != EXPECTED_KEYS:
            raise ValueError("Missing, duplicated or unexpected case identity")
        if any(r.get("execution_authorized") is not False for r in rows):
            raise ValueError("Execution authority is not boolean false")
    # JSON serialization distinguishes booleans from integers, unlike Python ==.
    left_by_key = {(r["case_id"], r["mode"]): r for r in left}
    right_by_key = {(r["case_id"], r["mode"]): r for r in right}
    for key in EXPECTED_KEYS:
        a = json.dumps(left_by_key[key], sort_keys=True, allow_nan=False)
        b = json.dumps(right_by_key[key], sort_keys=True, allow_nan=False)
        if a != b:
            raise ValueError(f"Complete result differs: {key}")


def calibrate(rows):
    strict_compare(rows, copy.deepcopy(rows))
    mutants = {}
    for name in ("digest", "count", "all_allow", "all_block", "authority_type", "missing", "duplicate", "extra"):
        mutant = copy.deepcopy(rows)
        if name == "digest": mutant[0]["packet"]["source_digest"] = "0" * 64
        elif name == "count": mutant[0]["packet"]["evidence_count"] += 1
        elif name == "all_allow":
            for r in mutant: r["disposition"] = "ALLOW"
        elif name == "all_block":
            for r in mutant: r["disposition"] = "BLOCK"
        elif name == "authority_type": mutant[0]["execution_authorized"] = 0
        elif name == "missing": mutant.pop()
        elif name == "duplicate": mutant[-1] = copy.deepcopy(mutant[0])
        elif name == "extra": mutant.append(copy.deepcopy(mutant[0]))
        try:
            strict_compare(mutant, rows)
        except ValueError:
            mutants[name] = "detected"
        else:
            raise ValueError(f"Comparator failed deliberate calibration: {name}")
    return mutants


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    for arg in ("reference", "documents", "submission", "output"):
        ap.add_argument("--" + arg, type=Path, required=True)
    args = ap.parse_args()
    reference, documents, submission, output = [getattr(args, k).resolve() for k in ("reference", "documents", "submission", "output")]
    if any(output == root or root in output.parents for root in (reference, documents, submission)):
        raise ValueError("Output must be outside the three input directories")
    if output.exists(): raise ValueError("Use a new output directory; prior evidence is not overwritten")
    verify(reference, SOURCE)
    verify(documents, DOCUMENTS)
    verify(submission, {"SHA256SUMS": MANIFEST_SHA256})
    manifest = {}
    for line in (submission / "SHA256SUMS").read_text().splitlines():
        digest, path = line.split(maxsplit=1)
        if Path(path).name != path or path in manifest:
            raise ValueError("Unexpected manifest path")
        manifest[path] = digest
    if len(manifest) != 12: raise ValueError("Unexpected manifest size")
    verify(submission, manifest)
    output.mkdir(parents=True)
    env = dict(os.environ)
    for key in ("NODE_OPTIONS", "NODE_PATH", "PYTHONPATH", "PYTHONHOME"):
        env.pop(key, None)
    commands = [
        ("implementation_results.json", [sys.executable, "-I", str(submission / "recompute.py")]),
        ("reference_results.json", ["node", str(submission / "reference_capture.mjs"), str(reference)]),
        ("comparison.json", [sys.executable, "-I", str(submission / "compare.py"), str(output / "implementation_results.json"), str(output / "reference_results.json")]),
        ("reference_probes.json", ["node", str(submission / "reference_probe.mjs"), str(reference)]),
        ("implementation_probes.json", [sys.executable, "-I", str(submission / "probes.py")]),
    ]
    hashes = {}
    for name, command in commands:
        run = subprocess.run(command, cwd=output, env=env, stdin=subprocess.DEVNULL, capture_output=True, timeout=30, check=False)
        (output / name).write_bytes(run.stdout)
        (output / (name + ".stderr")).write_bytes(run.stderr)
        if run.returncode != 0: raise ValueError(f"{name}: process exit {run.returncode}")
        if run.stdout != (submission / name).read_bytes(): raise ValueError(f"{name}: regenerated bytes differ")
        hashes[name] = sha(run.stdout)
    implementation = json.loads((output / "implementation_results.json").read_text())
    reference_rows = json.loads((output / "reference_results.json").read_text())
    strict_compare(implementation, reference_rows)
    controls = calibrate(reference_rows)
    verify(reference, SOURCE)
    verify(documents, DOCUMENTS)
    verify(submission, manifest)
    summary = {
        "source_commit": "0f3c71fdb0e9078d8a5d8684411d0318fe600bb1",
        "document_commit": "3903ec2323f7c8060ade54f1dcd01f2299556a66",
        "gist_revision": "f65d3f3ec1c32023c5e504f1187b6a4644d6c7db",
        "class": "project-side replay; not an additional independent evaluation",
        "python": platform.python_version(),
        "node": subprocess.check_output(["node", "--version"], env=env, text=True).strip(),
        "platform": platform.system() + " " + platform.machine(),
        "cases": 12, "full_object_matches": 12, "clean_allows": 6, "tampered_blocks": 6,
        "execution_authorized": False,
        "regenerated_files_byte_identical": hashes,
        "project_side_comparator_calibration": controls,
        "inputs_unchanged": True,
        "model_family_independence": "not established; reported Claude correlation with #71 retained",
        "campaign_count_changed": False,
    }
    (output / "project-replay-summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
