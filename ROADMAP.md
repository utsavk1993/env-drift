# Roadmap

What's planned for env-drift, roughly in order. Hour estimates are rough.

## v0.2: Tests and CI (about 5 hours)
- [ ] Unit tests for every detection pattern, the `.env` parser and the analysis, using small fixture repos
- [ ] GitHub Actions workflow running typecheck, tests and build on each pull request
- [ ] Coverage threshold

## v0.3: Better detection (about 8 hours)
- [ ] Destructuring: `const { API_KEY, DB_URL } = process.env`
- [ ] Framework sources: Next.js `next.config` `env`, Vite `loadEnv`, `@t3-oss/env` and zod env schemas
- [ ] Docker and CI files: `docker-compose.yml` `environment:`, GitHub Actions `env:`
- [ ] Warn on dynamic access (`process.env[name]`) that can't be resolved statically
- [ ] Multiline values and `${VAR}` expansion in `.env` files

## v0.4: Configuration and fixes (about 5 hours)
- [ ] `.env-drift.json` config: ignore lists, extra patterns, multiple example files (monorepos)
- [ ] `--fix`: append undocumented names to `.env.example` with a placeholder comment, and remove unused ones with `--prune`
- [ ] Report empty required values in `.env` (present but blank)

## v0.5: Distribution (about 5 hours)
- [ ] Publish to npm from GitHub Actions with provenance, so `npx env-drift` works
- [ ] Pre-commit hook recipe (husky, lefthook, pre-commit)
- [ ] GitHub Action that comments on PRs that add a variable without documenting it
- [ ] SARIF and Markdown output

## Later ideas
- Compare against variables set on hosting platforms (for example from an exported env list) without reading values
- Monorepo mode with one report per package
- Editor integration (VS Code diagnostics)
