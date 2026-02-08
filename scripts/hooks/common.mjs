import { execFileSync } from "node:child_process";

export function git(args, options = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    }).trimEnd();
  } catch (error) {
    const stderr = error?.stderr?.toString() ?? "";
    const message = stderr || error.message;
    throw new Error(`git ${args.join(" ")} failed: ${message}`);
  }
}

export function listStagedFiles() {
  const output = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
  if (!output) {
    return [];
  }
  return output.split(/\r?\n/).filter(Boolean);
}
