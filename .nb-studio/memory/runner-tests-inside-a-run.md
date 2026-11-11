---
name: Run runner tests without the run's own wrappers
description: Inside an agent run, the run's bin directory wraps git, pnpm and npm; strip it from PATH before running agent-runner tests or checkout tests fail on the git guard.
type: feedback
modified: 2026-11-09
---

When an agent runs `@nocobase/agent-runner` tests during its own run, remove the run's `.nocobase-runner/bin` directory from PATH first, for example `export PATH=$(echo $PATH | tr ':' '\n' | grep -v '/.nocobase-runner/runs/' | paste -sd:)` in the same shell command as `vitest`.

**Why:** That directory holds the outer runner's `git` wrapper and command guard, and the tests' own daemon then wraps that wrapper. Checkout, worktree and runner end-to-end tests fail with `refused: the run may not set credential.* for a git command (-c)`, which looks like a regression but comes only from the environment.

**How to apply:** Strip the directory before concluding that a runner test fails because of a change; the same tests pass on CI and outside a run.
