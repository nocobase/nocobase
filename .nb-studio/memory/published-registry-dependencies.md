---
name: Published runtime dependencies must come from a registry
description: The owner rejected SheetJS CDN dependencies in published packages because pnpm 11 blocks exotic subdependencies in generated applications by default.
type: feedback
modified: 2026-11-12
---

Use npm registry packages for the runtime dependencies of published packages. Do not declare an HTTPS tarball or Git source there, or ask consuming applications to disable `blockExoticSubdeps`.

**Why:** A direct tarball can install successfully in this source workspace and in an application's deployment while failing as a transitive dependency of the same package in a generated application. pnpm 11.11's default `blockExoticSubdeps` rejects that published dependency graph with `ERR_PNPM_EXOTIC_SUBDEP`.

**How to apply:** Validate source changes through `scripts/smoke-create-app.sh` against the locally published package snapshot. A workspace build alone misses this installation boundary. For spreadsheet extraction, `@e965/xlsx` is an npm repack of the fixed SheetJS parser; verify parser files against the official distribution and retain XLS/XLSX/XLSM multi-sheet tests when changing its source again.
