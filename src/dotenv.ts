/**
 * Reads variable names from a .env-style file. Values are never returned,
 * so secrets from a real .env can't leak into the report.
 */
export function parseEnvNames(text: string): Map<string, { line: number; empty: boolean }> {
  const names = new Map<string, { line: number; empty: boolean }>();
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m?.[1]) return;
    const value = (m[2] ?? "").replace(/\s+#.*$/, "").replace(/^["']|["']$/g, "").trim();
    if (!names.has(m[1])) names.set(m[1], { line: i + 1, empty: value === "" });
  });
  return names;
}
