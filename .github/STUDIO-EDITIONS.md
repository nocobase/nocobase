# Studio edition image rollout

The Studio source must first contain the edition build entry from nocobase/studio#476. Image workflows call `pnpm build:image` at an immutable source commit, then package its checked output with explicit `EDITION` and `SOURCE_REVISION` Docker build arguments. They do not assemble editions by deleting files from a completed artifact.

## Workflow ownership and rollout order

1. Merge and verify the Studio edition implementation before enabling these workflows for its source branches. Both `dev` (beta releases) and `main` (latest releases) must have the entry before releasing that channel. Older source revisions intentionally fail rather than publish the wrong edition.
2. Merge the implementation in `nocobase/nocobase` on `v3` (formerly `v3-develop`), the default branch, from which the workflow is dispatched directly; the former thin dispatch entry on `main` is obsolete. Release promotion brings the implementation to `v3-main`.
3. Update `2013xile/nocobase-ci`'s `studio-image.yml`. It publishes only `studio-ee`, for amd64 and arm64, with one shared dev timestamp. Its `dry_run=true` mode accepts either edition, builds and smoke-tests the images without registry credentials or publication, and is suitable for validation before the coordinated merge. Its image repository changes from `nocobase/studio` to `nocobase/studio-ee` in the existing internal registry; dev/main/dev-SHA tag rules stay unchanged. `chenos/nocobase-ci` has no image workflow to synchronize.
4. Ensure the registry permits publication of `nocobase/studio-ee` and has the intended customer access/license rules. A workflow cannot provision registry product authorization. The formal registry remains `pkg-v3.nocobase.com`; ordinary and EE publish to `nocobase/studio` and `nocobase/studio-ee` respectively, with the same release version.
5. Validate all three editions through internal `studio-image.yml` with `dry_run=true`, the same full Studio commit in `ref`, and one run per `edition`. Each run builds amd64 and arm64 and checks startup, authenticated access, Quality route/API-document isolation and the version service. Public release runs are operator-controlled: do not dispatch `v3-studio-release.yml` as part of the internal rollout. When the release operator is ready, its `dry_run=true` mode can also build all six combinations; optional `source_ref` accepts only a full Studio commit and cannot be used for publication.
6. Publish and verify an internal EE image, then explicitly update the internal deployment's image reference to `nocobase/studio-ee`. Keep database/config/storage mounts intact. No running deployment is changed by these CI branches.

## Publication and recovery

The formal workflow checks all three image repositories before building and records the source commit, version, per-edition tags and current moving-tag digests. Six independent builds upload edition/architecture-specific digest artifacts retained for 30 days. There is one manifest publication job and one downstream Git tag/version-bump/release job.

Publication reconstructs deterministic OCI indexes from the original six platform digests, checks all three editions for conflicts before writing, publishes all version tags, then advances moving tags. Existing version tags are accepted only when their digest exactly matches the original plan. A moving tag changed by another release is not rolled back. This relies on the existing workflow-wide release concurrency lock; do not use out-of-band publishers for these tags while a release is running.

After a partial failure, use **Re-run failed jobs** on the original run within artifact retention. GitHub retains outputs and artifacts of successful preparation/build jobs. The retry skips matching published versions and aliases and only finishes missing writes. A missing artifact, unavailable registry, conflicting version digest or changed moving alias stops the retry. Do not start a new run, rebuild successful image jobs, or choose Re-run all jobs to repair a partially published version. If artifacts expire, recover the original digests and resolve publication manually; do not overwrite a version to make the workflow green.

The beta channel preserves a stable `latest` independently for each edition. The latest channel explicitly advances `latest` for all three. Git tag, changelog and version bump run once only after all three editions have published successfully. Existing post-publication Git/PR recovery rules still apply.

## Local verification

Run `node --test scripts/tests/studio-release-images.test.mjs scripts/tests/studio-release-workflow.test.mjs` and `actionlint .github/workflows/v3-studio-release.yml`. The publication tests exercise independent tag decisions, partial writes, lost responses, conflicting versions, newer moving aliases, malformed artifacts and registry failures. Preparation runs the publication tests before contacting the source repository.

Protocol references: [OCI distribution](https://github.com/opencontainers/distribution-spec/blob/main/spec.md) and [GitHub failed-job reruns](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs).

## Private package authentication

Studio includes the private Kingbase driver from `https://pkg-v3.nocobase.com/`. Configure `PRO_NPM_TOKEN` with read access in both `nocobase/nocobase` and `2013xile/nocobase-ci`; secrets are not shared between repositories. The release and internal image workflows write a temporary user npmrc and pass `NPM_CONFIG_USERCONFIG` through the isolated edition build, then remove it even on failure. Dry runs also need package read access, but need no Docker publishing credential. The final prebuilt image requires no npm token. Studio preview, distribution and quality CI installations need the same read access in their respective CI repositories.


## Community image

The formal release matrix includes `studio-ce`, `studio` and `studio-ee` on amd64 and arm64. CE is displayed as NocoBase Studio CE and has no License, Requester or Quality plugin. The source's shared composition table controls preparation and artifact validation; the release workflow does not remove files from an existing artifact. Both paid images keep License, including the private npm token service. License Key types remain professional/enterprise.

The registry must make `nocobase/studio-ce` public without a License Key. Registry access policy is operated separately from this workflow. Each image gets its own public English and Chinese notes; CE notes omit requester, Quality and License entries. Publication validates all six original platform digests before writing any manifest, and retains the existing immutable-version and interrupted-publication recovery rules. Internal image CI continues to publish EE only.
