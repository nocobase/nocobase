---
'@nocobase/app-cli': major
'@nocobase/app-skills': minor
---

Tidy the `release upload` and `release deploy` commands and make `--json` output consistent across the CLI.

- The JSON document's `operation` is now `release:upload` or `release:deploy`, matching the command id, instead of `app.upload` or `app.deploy`. Scripts that match on the old values need updating.
- `release upload` and `release deploy` are no longer registered in a built `dist/`. They publish the archive `nocobase build --tar` writes beside the sources, so run them in the source checkout or in CI.
- A path given to `--file` or `--config` now resolves from the current directory rather than from the App root. Without `--file`, upload still reads `storage/exports/dist.tar.gz` in the App root.
- An argument error names the flag that is missing, invalid or unknown, such as `Missing required flag --release-id.`, and still never repeats a value. A failure with no known cause suggests `NOCOBASE_CLI_DEBUG=1`, which prints that cause to stderr.
- Both commands have a description and examples in `--help`, and `--hub` is described the same way on both.
- `plugin register`, `plugin unregister`, `plugin update`, `plugin inspect`, `package remove` and `skills sync` print a `--json` failure on stdout, as a success already was and as every other command already did. A caller reads one stream and checks the exit code.
- The Hub publishing guidance moves from the `nocobase-app-development` Skill to `nocobase-deployment`, the CLI reference describes the stdout-only `--json` contract and path resolution, and the Hub API key Skill states the new path rule.
