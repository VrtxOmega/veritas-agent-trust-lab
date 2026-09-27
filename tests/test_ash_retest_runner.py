"""Offline instrument regressions; does not execute ASH or network targets."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("ash_runner", ROOT / "scripts/reproduce-ash-v4261-reachability.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


class FreshReportTests(unittest.TestCase):
    def test_old_report_cannot_be_mistaken_for_a_failed_current_run(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "out.json"
            original = '{"results":[{"passed":true}]}'
            path.write_text(original)
            failed = subprocess.CompletedProcess([], 1, "", "import failed")
            with patch.object(runner.subprocess, "run", return_value=failed) as called:
                with self.assertRaises((FileExistsError, RuntimeError)):
                    runner.run_module("python", "synthetic", "http://127.0.0.1", "--output", path)
                called.assert_not_called()
            self.assertEqual(path.read_text(), original)

    def test_missing_report_preserves_diagnostics(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "out.json"
            failure = subprocess.CompletedProcess([], 2, "out", "import failed")
            with patch.object(runner.subprocess, "run", return_value=failure):
                with self.assertRaisesRegex(RuntimeError, "no report"):
                    runner.run_module("python", "synthetic", "http://127.0.0.1", "--output", path)
            self.assertEqual(path.with_suffix(".stderr.txt").read_text(), "import failed")
            self.assertEqual(path.with_suffix(".stdout.txt").read_text(), "out")
            self.assertEqual(json.loads(path.with_suffix(".command.json").read_text())["returncode"], 2)

    def test_new_report_and_expected_nonzero_status_are_retained(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "out.json"
            report = {"results": [{"test_id": "CONTROL", "not_evaluated": True}]}
            def execute(*args, **kwargs):
                path.write_text(json.dumps(report))
                return subprocess.CompletedProcess(args[0], 2, "INCONCLUSIVE", "")
            with patch.object(runner.subprocess, "run", side_effect=execute):
                rc, actual = runner.run_module("python", "synthetic", "http://127.0.0.1", "--output", path)
            self.assertEqual(rc, 2)
            self.assertEqual(actual, report)


if __name__ == "__main__":
    unittest.main()
