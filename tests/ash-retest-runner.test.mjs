import test from "node:test";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("ASH retest instrument rejects stale reports and keeps diagnostics", () => {
  const python = process.platform === "win32" ? "python" : "python3";
  execFileSync(python, [fileURLToPath(new URL("./test_ash_retest_runner.py", import.meta.url))], {
    cwd: new URL("..", import.meta.url),
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 10000,
  });
});
