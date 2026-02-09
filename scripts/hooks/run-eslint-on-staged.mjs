#!/usr/bin/env node
import path from "node:path";
import { execFileSync } from "node:child_process";
import { listStagedFiles } from "./common.mjs";

const stagedFiles = listStagedFiles();
const lintTargets = stagedFiles
  .filter((file) => /^client\/src\/.*\.(js|jsx)$/.test(file))
  .filter((file) => !/\/tests\//.test(file))
  .filter((file) => !/\.test\.(js|jsx)$/.test(file))
  .map((file) => file.replace(/^client\//, ""));

if (lintTargets.length === 0) {
  process.exit(0);
}

const isWindows = process.platform === "win32";
const clientDir = path.resolve("client");

execFileSync(
  "npx",
  ["--no-install", "eslint", "--max-warnings=0", ...lintTargets],
  {
    cwd: clientDir,
    shell: isWindows,
    stdio: "inherit",
  }
);
