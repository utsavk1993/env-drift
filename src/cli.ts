#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { analyze, hasProblems } from "./analyze.js";
import { parseEnvNames } from "./dotenv.js";
import { scanRepo } from "./scan.js";

const HELP = `Usage: env-drift [dir] [options]

Compares the environment variables your code reads with .env.example.

Options:
  --example <file>   Example file (default: .env.example)
  --env <file>       Local env file to check for missing values (default: .env, if present)
  --ignore <names>   Comma-separated variable names to skip
  --json             Print the result as JSON
  -h, --help         Show this help

Exit codes: 0 no drift, 1 drift found, 2 usage error.
`;

function readIfExists(path: string): string | undefined {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
}

export function main(argv: string[]): number {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      example: { type: "string", default: ".env.example" },
      env: { type: "string" },
      ignore: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  if (values.help) {
    process.stdout.write(HELP);
    return 0;
  }

  const root = resolve(positionals[0] ?? ".");
  const exampleText = readIfExists(join(root, values.example));
  if (exampleText === undefined) {
    process.stderr.write(`No ${values.example} found in ${root}. Create one, or pass --example.\n`);
    return 2;
  }
  const localText = readIfExists(join(root, values.env ?? ".env"));
  if (values.env && localText === undefined) {
    process.stderr.write(`Env file not found: ${values.env}\n`);
    return 2;
  }

  let usages;
  try {
    usages = scanRepo(root);
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    return 2;
  }

  const example = new Set(parseEnvNames(exampleText).keys());
  const local = localText === undefined ? undefined : new Set(parseEnvNames(localText).keys());
  const ignore = new Set(values.ignore?.split(",").map((s) => s.trim()).filter(Boolean));
  const result = analyze(usages, example, local, ignore);

  if (values.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return hasProblems(result) ? 1 : 0;
  }

  const out: string[] = [`Scanned ${root}: ${result.totalUsed} variable(s) read in code, ${example.size} in ${values.example}.`, ""];
  if (result.undocumented.length) {
    out.push(`Used in code but missing from ${values.example}:`);
    for (const u of result.undocumented) {
      const where = u.usages.slice(0, 3).map((x) => `${x.file}:${x.line}`).join(", ");
      const more = u.usages.length > 3 ? ` (+${u.usages.length - 3} more)` : "";
      out.push(`  ${u.name}  ${where}${more}`);
    }
    out.push("");
  }
  if (result.unused.length) {
    out.push(`In ${values.example} but never read in code:`);
    for (const n of result.unused) out.push(`  ${n}`);
    out.push("");
  }
  if (result.missingLocally.length) {
    out.push(`Missing from your local ${values.env ?? ".env"}:`);
    for (const n of result.missingLocally) out.push(`  ${n}`);
    out.push("");
  }
  out.push(hasProblems(result) ? "Drift found." : "No drift. Code and example file agree.");
  process.stdout.write(out.join("\n") + "\n");
  return hasProblems(result) ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
