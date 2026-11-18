// Shared helpers for the Claude Code hooks in this folder.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/** Reads the hook input JSON from stdin. Returns {} when stdin is empty or not JSON. */
export function readHookInput() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Walks up from `start` and returns the first directory that holds `.git` (a folder or a worktree file). */
export function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** True when `root` is a checkout of this repository that carries these hooks. */
export function isThisRepo(root) {
  return Boolean(root) && existsSync(path.join(root, ".claude", "hooks", "hook-utils.mjs"));
}

/**
 * Locates a file inside this repository.
 * Returns { root, rel, abs } with `rel` using forward slashes, or null for files outside the repository.
 */
export function locate(filePath) {
  if (!filePath) return null;
  const abs = path.resolve(filePath);
  const root = findRepoRoot(path.dirname(abs));
  if (!isThisRepo(root)) return null;
  const rel = path.relative(root, abs).split(path.sep).join("/");
  if (rel.startsWith("../")) return null;
  return { root, rel, abs };
}
