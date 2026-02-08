#!/usr/bin/env node
import path from "node:path";
import { execFileSync } from "node:child_process";
import { git } from "./common.mjs";

const ZERO_SHA = "0000000000000000000000000000000000000000";

function scanRange(rangeText) {
  const nodeCmd = process.execPath;
  execFileSync(nodeCmd, [path.resolve("scripts/hooks/scan-secrets.mjs"), "--range", rangeText], {
    stdio: "inherit",
  });
}

function runLint() {
  const isWindows = process.platform === "win32";
  execFileSync("npm", ["--prefix", "client", "run", "lint"], {
    shell: isWindows,
    stdio: "inherit",
  });
}

function buildRangesFromStdin(input) {
  const ranges = [];
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const [localRef, localSha, remoteRef, remoteSha] = line.split(/\s+/);
    if (!localSha || localSha === ZERO_SHA) {
      continue;
    }

    if (!remoteSha || remoteSha === ZERO_SHA) {
      const commitsText = git(["rev-list", localSha, "--not", "--remotes"]);
      const commits = commitsText.split(/\r?\n/).filter(Boolean);
      for (const commit of commits) {
        ranges.push(`${commit}^!`);
      }
      continue;
    }

    ranges.push(`${remoteSha}..${localSha}`);
  }

  return ranges;
}

let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  stdin += chunk;
});

process.stdin.on("end", () => {
  const ranges = buildRangesFromStdin(stdin);
  if (ranges.length === 0) {
    ranges.push("HEAD^!");
  }

  for (const range of ranges) {
    scanRange(range);
  }

  runLint();
});
