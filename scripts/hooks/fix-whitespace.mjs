#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { listStagedFiles } from "./common.mjs";

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".css",
  ".scss",
  ".html",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
  ".xml",
  ".java",
  ".properties",
  ".env",
  ".sh",
  ".ps1",
  ".mjs",
  ".cjs",
  ".gitignore",
]);

function isTextFile(filePath) {
  const base = path.basename(filePath);
  if (base === ".gitignore" || base === ".gitattributes") {
    return true;
  }
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function normalizeWhitespace(content) {
  const eol = content.includes("\r\n") ? "\r\n" : "\n";
  let normalized = content.replace(/\r\n/g, "\n");

  normalized = normalized.replace(/[ \t]+$/gm, "");
  normalized = normalized.replace(/^[ \t]+$/gm, "");
  normalized = normalized.replace(/\n+$/g, "\n");

  if (normalized.length > 0 && !normalized.endsWith("\n")) {
    normalized += "\n";
  }

  return normalized.replace(/\n/g, eol);
}

function restage(files) {
  if (files.length === 0) {
    return;
  }
  execFileSync("git", ["add", "--", ...files], { stdio: "inherit" });
}

const stagedFiles = listStagedFiles();
const updatedFiles = [];

for (const file of stagedFiles) {
  if (!isTextFile(file) || !fs.existsSync(file)) {
    continue;
  }

  const buffer = fs.readFileSync(file);
  if (buffer.includes(0)) {
    continue;
  }

  const original = buffer.toString("utf8");
  if (original.includes("\uFFFD")) {
    continue;
  }

  const cleaned = normalizeWhitespace(original);
  if (cleaned !== original) {
    fs.writeFileSync(file, cleaned, "utf8");
    updatedFiles.push(file);
  }
}

restage(updatedFiles);

if (updatedFiles.length > 0) {
  console.log("Whitespace fixed in:");
  for (const file of updatedFiles) {
    console.log(`- ${file}`);
  }
}
