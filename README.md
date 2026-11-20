# env-drift

A command-line tool that keeps `.env.example` honest. It scans your code for the environment variables it actually reads and compares them with `.env.example`, then tells you:

- which variables the code uses but `.env.example` doesn't document (the "works on my machine" bug for the next person who clones the repo)
- which entries in `.env.example` nothing reads any more
- which documented variables your local `.env` is missing

It only reads variable **names** from `.env` files, never values, so secrets never appear in its output.

**Who it's for:** developers who share a project with others, or come back to their own project months later and can't remember which variables it needs.

**Built with:** TypeScript on Node.js 20+. No runtime dependencies.

> **Status:** early and in active development (v0.1). See the [roadmap](ROADMAP.md).

## Install

Not on npm yet. Run it from source:

```sh
git clone https://github.com/utsavk1993/env-drift.git
cd env-drift
npm install
npm run build
npm link        # optional: puts `env-drift` on your PATH
```

## Usage

```sh
env-drift                       # check the repo in the current directory
env-drift ../my-app             # check another repo
env-drift --example .env.sample # use a different example file
env-drift --env .env.local      # check a different local env file
env-drift --ignore SENTRY_DSN   # skip some variables
env-drift --json                # machine-readable output
```

Example output:

```text
Used in code but missing from .env.example:
  STRIPE_KEY  app.js:2

In .env.example but never read in code:
  OLD_FLAG

Missing from your local .env:
  REDIS_URL

Drift found.
```

Exit codes: `0` no drift, `1` drift found, `2` usage error. That makes it easy to run in CI or a pre-commit hook.

## What it detects

| Language | Patterns |
|---|---|
| JavaScript / TypeScript | `process.env.X`, `process.env["X"]`, `import.meta.env.X`, `Deno.env.get("X")`, `Bun.env.X` |
| Python | `os.environ["X"]`, `os.environ.get("X")`, `os.getenv("X")` |
| Ruby | `ENV["X"]`, `ENV.fetch("X")` |
| Go | `os.Getenv("X")`, `os.LookupEnv("X")` |
| Rust | `env::var("X")`, `env!("X")` |
| PHP | `getenv('X')`, `$_ENV['X']` |

Common runtime variables such as `NODE_ENV`, `PORT` and `CI` are skipped. Only files tracked by git (or untracked but not ignored) are scanned.

## TODO

The short version. The full plan is in [ROADMAP.md](ROADMAP.md).

- [ ] Unit tests and CI
- [ ] Config file (`.env-drift.json`) for ignores and extra patterns
- [ ] Detect destructuring (`const { API_KEY } = process.env`) and framework config (Next.js `env`, Vite `loadEnv`)
- [ ] `--fix` to append missing names to `.env.example`
- [ ] Publish to npm, plus a pre-commit hook and a GitHub Action

## License

[MIT](LICENSE) © 2026 Utsav Kumar
