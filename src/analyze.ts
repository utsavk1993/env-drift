import type { Usage } from "./scan.js";

/** Set by the runtime or platform, so they don't need to be in .env.example. */
export const BUILTIN = new Set([
  "NODE_ENV", "PATH", "HOME", "PWD", "USER", "SHELL", "TERM", "CI", "TZ", "LANG", "TMPDIR",
  "PORT", "DEBUG", "NO_COLOR", "FORCE_COLOR", "MODE", "DEV", "PROD", "SSR", "BASE_URL",
  "VERCEL", "VERCEL_ENV", "VERCEL_URL", "GITHUB_ACTIONS", "GITHUB_TOKEN",
]);

export interface Analysis {
  /** Read in code but not listed in the example file. */
  undocumented: { name: string; usages: Usage[] }[];
  /** Listed in the example file but never read in code. */
  unused: string[];
  /** Read in code and in the example, but missing from the local .env. */
  missingLocally: string[];
  totalUsed: number;
}

export function analyze(
  usages: Usage[],
  example: Set<string>,
  local: Set<string> | undefined,
  ignore: Set<string> = new Set(),
): Analysis {
  const byName = new Map<string, Usage[]>();
  for (const u of usages) {
    if (BUILTIN.has(u.name) || ignore.has(u.name)) continue;
    byName.set(u.name, [...(byName.get(u.name) ?? []), u]);
  }
  const used = [...byName.keys()].sort();

  return {
    undocumented: used.filter((n) => !example.has(n)).map((name) => ({ name, usages: byName.get(name) ?? [] })),
    unused: [...example].filter((n) => !byName.has(n) && !ignore.has(n)).sort(),
    missingLocally: local ? used.filter((n) => example.has(n) && !local.has(n)) : [],
    totalUsed: used.length,
  };
}

export function hasProblems(a: Analysis): boolean {
  return a.undocumented.length > 0 || a.unused.length > 0 || a.missingLocally.length > 0;
}
