# Studio edition image rollout

The Studio source must first contain the edition build entry from nocobase/studio#476. Image workflows call `pnpm build:image` at an immutable source commit, then package its checked output with explicit `EDITION` and `SOURCE_REVISION` Docker build arguments. They do not assemble editions by deleting files from a completed artifact.

## Workflow ownership and rollout order

1. Merge and verify the Studio edition implementation before enabling these workflows for its source branches. Both `dev` (beta releases) and `main` (latest releases) must have the entry before releasing that channel. Older source revisions intentionally fail rather than publish the wrong edition.
2. Merge the implementation in `nocobase/nocobase` on `v3-develop`. The paired `main` change replaces the old duplicate workflow with the standard thin dispatch entry, preserving `channel` and `dry_run` inputs and forwarding to `v3-develop`. Merge the implementation before that entry. Release promotion brings the implementation to `v3-main`.
3. Update `2013xile/nocobase-ci`'s `studio-image.yml`. It builds only `studio-ee`, for amd64 and arm64, with one shared dev timestamp. Its image repository changes from `nocobase/studio` to `nocobase/studio-ee` in the existing internal registry; dev/main/dev-SHA tag rules stay unchanged. `chenos/nocobase-ci` has no image workflow to synchronize.
4. Ensure the registry permits publication of `nocobase/studio-ee` and has the intended customer access/license rules. A workflow cannot provision registry product authorization. The formal registry remains `pkg-v3.nocobase.com`; ordinary and EE publish to `nocobase/studio` and `nocobase/studio-ee` respectively, with the same release version.
5. Run `v3-studio-release.yml` with `dry_run=true` against a source branch containing the edition implementation. This builds all four edition/platform combinations without pushing images, tags or releases. The local contract tests are not a substitute for this real build.
6. Publish and verify an internal EE image, then explicitly update the internal deployment's image reference to `nocobase/studio-ee`. Keep database/config/storage mounts intact. No running deployment is changed by these CI branches.

## Publication and recovery

The formal workflow checks both repositories before building and records the source commit, version, per-edition tags and current moving-tag digests. Four independent builds upload edition/architecture-specific digest artifacts retained for 30 days. There is one manifest publication job and one downstream Git tag/version-bump/release job.

Publication reconstructs deterministic OCI indexes from the original four platform digests, checks both editions for conflicts before writing, publishes both version tags, then advances moving tags. Existing version tags are accepted only when their digest exactly matches the original plan. A moving tag changed by another release is not rolled back. This relies on the existing workflow-wide release concurrency lock; do not use out-of-band publishers for these tags while a release is running.

After a partial failure, use **Re-run failed jobs** on the original run within artifact retention. GitHub retains outputs and artifacts of successful preparation/build jobs. The retry skips matching published versions and aliases and only finishes missing writes. A missing artifact, unavailable registry, conflicting version digest or changed moving alias stops the retry. Do not start a new run, rebuild successful image jobs, or choose Re-run all jobs to repair a partially published version. If artifacts expire, recover the original digests and resolve publication manually; do not overwrite a version to make the workflow green.

The beta channel preserves a stable `latest` independently for each edition. The latest channel explicitly advances `latest` for both. Git tag, changelog and version bump run once only after both editions have published successfully. Existing post-publication Git/PR recovery rules still apply.

## Local verification

Run `node --test scripts/tests/studio-release-images.test.mjs` and `actionlint .github/workflows/v3-studio-release.yml`. The publication tests exercise independent tag decisions, partial writes, lost responses, conflicting versions, newer moving aliases, malformed artifacts and registry failures. Preparation runs the publication tests before contacting the source repository. The main entry must expose exactly the implementation's dispatch inputs and route to `v3-develop`.

Protocol references: [OCI distribution](https://github.com/opencontainers/distribution-spec/blob/main/spec.md) and [GitHub failed-job reruns](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs).
