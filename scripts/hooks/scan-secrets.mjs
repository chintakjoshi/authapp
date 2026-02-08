#!/usr/bin/env node
import { git } from "./common.mjs";

const args = process.argv.slice(2);
let mode = "staged";
let range = "";

if (args[0] === "--range") {
  mode = "range";
  range = args[1] ?? "";
  if (!range) {
    console.error("Missing range value. Usage: --range <A..B>");
    process.exit(1);
  }
} else if (args[0] === "--staged" || args.length === 0) {
  mode = "staged";
} else {
  console.error("Unsupported argument. Use --staged or --range <A..B>");
  process.exit(1);
}

const patterns = [
  { name: "Private key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/ },
  { name: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  {
    name: "JWT",
    regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/,
  },
  {
    name: "Generic credential assignment",
    regex:
      /\b(api[_-]?key|secret|token|password|client[_-]?secret|access[_-]?key)\b\s*[:=]\s*["'`][^"'`\n]{8,}["'`]/i,
  },
];

const placeholderRegex =
  /\b(example|sample|dummy|placeholder|changeme|your_|test|fake|mock)\b/i;

function getDiffText() {
  if (mode === "staged") {
    return git([
      "diff",
      "--cached",
      "--unified=0",
      "--no-color",
      "--diff-filter=ACMR",
    ]);
  }

  return git([
    "diff",
    range,
    "--unified=0",
    "--no-color",
    "--diff-filter=ACMR",
  ]);
}

function checkLine(line) {
  if (placeholderRegex.test(line)) {
    return null;
  }

  for (const { name, regex } of patterns) {
    if (regex.test(line)) {
      return name;
    }
  }
  return null;
}

function parseFindings(diff) {
  const findings = [];
  const lines = diff.split(/\r?\n/);
  let currentFile = "unknown";
  let addedLine = 0;

  for (const rawLine of lines) {
    if (rawLine.startsWith("+++ b/")) {
      currentFile = rawLine.slice(6);
      continue;
    }

    if (rawLine.startsWith("@@")) {
      const match = rawLine.match(/\+(\d+)(?:,\d+)?/);
      addedLine = match ? Number(match[1]) : 0;
      continue;
    }

    if (rawLine.startsWith("+") && !rawLine.startsWith("+++")) {
      const content = rawLine.slice(1);
      const type = checkLine(content);
      if (type) {
        findings.push({
          file: currentFile,
          line: addedLine,
          type,
          snippet: content.trim().slice(0, 180),
        });
      }
      addedLine += 1;
    }
  }

  return findings;
}

let diffText = "";
try {
  diffText = getDiffText();
} catch {
  process.exit(0);
}

if (!diffText.trim()) {
  process.exit(0);
}

const findings = parseFindings(diffText);
if (findings.length === 0) {
  process.exit(0);
}

console.error("Potential secret(s) detected:");
for (const finding of findings) {
  console.error(
    `- ${finding.file}:${finding.line} [${finding.type}] ${finding.snippet}`
  );
}
console.error(
  "Commit or push blocked. Remove the secret, move it to env vars, or use a placeholder."
);
process.exit(1);
