import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

/** A place in the source where an environment variable is read. */
export interface Usage {
  name: string;
  file: string;
  line: number;
}

const SOURCE_EXT = new Set([".js", ".mjs", ".cjs", ".jsx", ".ts", ".mts", ".cts", ".tsx", ".vue", ".svelte", ".astro", ".py", ".rb", ".go", ".rs", ".php"]);
const MAX_FILE_BYTES = 1024 * 1024;
const NAME = "([A-Z_][A-Z0-9_]*)";

const PATTERNS: RegExp[] = [
  // JavaScript / TypeScript: process.env.X, process.env["X"], import.meta.env.X, Deno.env.get("X"), Bun.env.X
  new RegExp(`process\\.env\\.${NAME}`, "g"),
  new RegExp(`process\\.env\\[\\s*["'\`]${NAME}["'\`]\\s*\\]`, "g"),
  new RegExp(`import\\.meta\\.env\\.${NAME}`, "g"),
  new RegExp(`Deno\\.env\\.get\\(\\s*["'\`]${NAME}["'\`]`, "g"),
  new RegExp(`Bun\\.env\\.${NAME}`, "g"),
  // Python: os.environ["X"], os.environ.get("X"), os.getenv("X")
  new RegExp(`os\\.environ\\[\\s*["']${NAME}["']\\s*\\]`, "g"),
  new RegExp(`os\\.(?:environ\\.get|getenv)\\(\\s*["']${NAME}["']`, "g"),
  // Ruby: ENV["X"], ENV.fetch("X")
  new RegExp(`ENV(?:\\.fetch\\(|\\[)\\s*["']${NAME}["']`, "g"),
  // Go: os.Getenv("X"), os.LookupEnv("X")
  new RegExp(`os\\.(?:Getenv|LookupEnv)\\(\\s*"${NAME}"`, "g"),
  // Rust: env::var("X"), env!("X"), std::env::var_os("X")
  new RegExp(`env(?:::var(?:_os)?\\(|!\\()\\s*"${NAME}"`, "g"),
  // PHP: getenv('X'), $_ENV['X']
  new RegExp(`(?:getenv\\(|\\$_ENV\\[)\\s*["']${NAME}["']`, "g"),
];

export function findUsages(file: string, text: string): Usage[] {
  const out: Usage[] = [];
  const lines = text.split("\n");
  lines.forEach((content, i) => {
    for (const re of PATTERNS) {
      for (const m of content.matchAll(re)) {
        if (m[1]) out.push({ name: m[1], file, line: i + 1 });
      }
    }
  });
  return out;
}

/** Lists source files tracked by git (falls back to nothing if not a git repo). */
export function listSourceFiles(root: string): string[] {
  let files: string[];
  try {
    files = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 256 * 1024 * 1024,
    })
      .split("\0")
      .filter(Boolean);
  } catch {
    throw new Error(`Not a git repository: ${root}`);
  }
  return files.filter((f) => SOURCE_EXT.has(extname(f).toLowerCase()));
}

export function scanRepo(root: string): Usage[] {
  const usages: Usage[] = [];
  for (const file of listSourceFiles(root)) {
    const path = join(root, file);
    try {
      if (statSync(path).size > MAX_FILE_BYTES) continue;
      usages.push(...findUsages(file, readFileSync(path, "utf8")));
    } catch {
      // Deleted or unreadable file: skip it.
    }
  }
  return usages;
}
