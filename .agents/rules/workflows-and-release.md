# V3 Workflows and Release Routing

Read this before adding, changing, renaming or deleting anything under `.github/workflows/`.

## V3 Workflow Synchronization

Keep executable workflow YAML files directly in `.github/workflows/`; GitHub Actions does not support workflow subdirectories. Prefix every v3 workflow filename with `v3-`, including matching entries on `main`. The v3 implementation is maintained on `v3-develop` and reaches `v3-main` through release promotion; stable-line workflow fixes must also be synchronized back to `v3-develop`.

The Quality checks are the exception: they have no workflow here. `nocobase-bot` forwards v3 pull requests from branches of this repository, and pushes to `v3-develop` without `[skip ci]`, to `nocobase3-quality.yml` in `chenos/nocobase-ci`, which is their only definition and where a change to them is made; see [.github/V3-MIGRATION.md](../../.github/V3-MIGRATION.md).

Every v3 workflow change must include a synchronization check of its corresponding `main` entry. Those entries dispatch the implementation from `v3-develop`, so implementation-only jobs and steps are picked up automatically rather than copied into `main`; explicitly confirm that the entry still reaches the updated implementation. Workflow additions, deletions, renames, dispatch input changes and scheduled/default-branch trigger changes must update the corresponding entry in the same delivery. Keep workflow calls, dispatch filenames, path filters, tests and documentation consistent, coordinate the paired branch rollout, and preserve existing v1/v2 workflows.

See [.github/V3-MIGRATION.md](../../.github/V3-MIGRATION.md) for release routing, repository configuration that maintainers must confirm, and intentional historical and independent Pro references. `release-beta/*` and `release/*` remain internal release candidate prefixes. OSS Beta aggregate tags use `nocobase-v3-beta/*`, accepting legacy `release-beta/*` tags when calculating batches and changelogs; stable tags remain `release/*`. GitHub Beta Release titles use `NocoBase v3 Beta · <batch>`; OSS target branches are `v3-develop` and `v3-main`.
