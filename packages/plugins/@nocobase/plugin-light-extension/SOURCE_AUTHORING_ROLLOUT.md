# Source Authoring Rollout

This checklist coordinates the Flow Surface, light-extension, ordinary RunJS workspace, CLI, and UI Builder Skill changes. Release the layers in this order so a Skill never calls a command that the target app cannot expose.

## Version floor

| Layer | Minimum target |
| --- | --- |
| App/backend | `2.2.0-beta.16`, `2.2.0`, or a later compatible channel build |
| `nb` CLI | `2.2.0-beta.16`, `2.2.0`, or later |
| Managed skills pack | `1.0.21` or later |
| Required plugin | `plugin-light-extension` enabled for light-extension source |
| Additional plugin | `plugin-vsc-file` enabled for ordinary RunJS workspace source |

Existing inline surfaces do not require migration. Missing `sourceMode` remains inline, and retained inline code on a light-extension owner remains fallback data rather than active authoring truth.

## Release order

1. Release the app/backend contracts: Flow Surface canonical `runJs`, binding validation/reference sync, light-extension source Swagger, and plugin-vsc-file RunJS workspace Swagger.
2. Release the CLI config and compatibility rules. Confirm the target app OpenAPI generates the documented command families and that old app/new Skill combinations are blocked.
3. Release the managed UI Builder Skill routing and references. Synchronize the canonical Skill to its installed copy and compare source checksums.
4. Run the regression gates below before enabling real-build or browser acceptance.

## Required regression order

1. Synthetic CLI generator and generated-command tests.
2. Flow Surface server contract tests, serially.
3. Light-extension server tests, serially.
4. client-v2 RunJS/source resolver tests.
5. Skill docs/runtime tests.
6. Quick artifact-only benchmark.
7. Real-build benchmark.
8. E2E.

Do not start steps 7-8 when any earlier gate is red.

## Contract audit

- Flow Surface owns UI structure, inline source, source binding, and instance settings.
- Light-extension authoring uses Entry/reference discovery, full-workspace preview, and delta save guarded by `expectedHeadCommitId`.
- Ordinary RunJS workspace authoring uses `open-latest`, complete-snapshot preview/save, `baseCommitId`, and `baseOwnerFingerprint`.
- HTTP 207 or 422 preview results never proceed to save. HTTP 409 requires reopening or pulling and rebuilding the candidate.
- Active light-extension owners cannot be saved through `runJSSources`, raw `vscFile`, direct artifact writes, or ZIP.
- ZIP is an interactive import/export and inspection boundary, not the existing-repository Agent local-edit path.
- A successful source commit is not enough: runtime artifact, owner fingerprint, binding/settings/fallback, references, and UI behavior must also be verified.

## Rollback review

Perform this dry-run review before release:

1. Skills rollback: confirm the source-mode router and new references can be reverted without changing persisted app data. The CLI compatibility gate must continue to block unavailable commands.
2. CLI rollback: confirm removing the light-extension and `run-js-sources` includes from `nocobase-ctl.config.json` hides the public commands without deleting backend actions.
3. Backend rollback: confirm inline Flow Surface authoring still accepts missing `sourceMode`. Roll back source-aware model families in bounded groups if needed.
4. Data/source rollback: do not delete `sourceBinding` rows or rewrite commit history. Failed saves already roll back transactionally. Revert a successful source version by saving the desired historical source as a new normal commit.

## Acceptance record

Record one machine-readable report with at least:

- app, CLI, managed skills, and enabled plugin versions;
- commands and exit codes;
- source routing decision;
- baseline/new commit IDs;
- preview/save status and diagnostics;
- visible reference count and visibility completeness;
- binding/settings/fallback before and after;
- UI behavior assertion;
- cleanup result;
- rollback readiness and final `GO` / `NO-GO` decision.
