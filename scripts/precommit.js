#!/usr/bin/env bun

/**
 * Precommit hook - runs lint:fix, copy-paste detection, and build.
 * Use --verbose flag to see full output from all checks.
 */

const verbose = process.argv.includes("--verbose");

const steps = [
  { name: "lint:fix", cmd: ["bun", "run", "lint:fix"] },
  { name: "cpd", cmd: ["bun", "run", "cpd"] },
  { name: "build", cmd: ["bun", "run", "build"] },
];

const runStep = (step) => {
  console.log(`\n▶ ${step.name}`);
  const proc = Bun.spawnSync(step.cmd, {
    stdio: verbose
      ? ["inherit", "inherit", "inherit"]
      : ["ignore", "pipe", "pipe"],
  });
  const ok = proc.exitCode === 0;
  if (!ok && !verbose) {
    process.stdout.write(proc.stdout?.toString() ?? "");
    process.stderr.write(proc.stderr?.toString() ?? "");
  }
  console.log(ok ? `✓ ${step.name} passed` : `✗ ${step.name} failed`);
  return ok;
};

console.log(
  verbose
    ? "Running precommit checks (verbose)...\n"
    : "Running precommit checks...",
);

let failed = 0;
for (const step of steps) {
  if (!runStep(step)) failed += 1;
}

console.log("\n=== PRECOMMIT SUMMARY ===");
console.log(failed === 0 ? "All checks passed." : `${failed} check(s) failed.`);

process.exit(failed === 0 ? 0 : 1);
