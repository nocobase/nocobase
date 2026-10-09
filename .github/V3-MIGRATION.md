# NocoBase 3 repository migration

NocoBase 3 is maintained in `nocobase/nocobase` on `v3-develop`, with stable promotion to `v3-main`. The repository's default branch is `main`, which continues to maintain the v1/v2 line. See `skills/README.md` for global Skill installation commands that explicitly select the v3 branch and Skill directory.

## Release routing

Executable v3 workflows live directly in `.github/workflows/` and use the `v3-` filename prefix. Their corresponding entries on `main` dispatch the implementation on `v3-develop`. An implementation-only change needs a check that this dispatch still reaches it; input, trigger, or filename changes need a coordinated update of the entry on `main` too.

| Workflow                                                                               | Source and destination                                                                                                                          | Registry or output                                     |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `v3-release-beta.yml`                                                                  | Release `v3-develop`, then merge version commits back there                                                                                     | Public npm, `beta` dist-tag                            |
| `v3-merge-beta-to-stable.yml`                                                          | Promote `v3-develop` into `v3-main`, then synchronize prerelease state back                                                                     | Version promotion only                                 |
| `v3-release-stable.yml`                                                                | Release `v3-main`, then synchronize back to `v3-develop`; an older branch uses `keep_latest`                                                    | Public npm, `latest` or `legacy` dist-tag              |
| `v3-github-release.yml`                                                                | Aggregate `release-beta/*` or `release/*` tags                                                                                                  | GitHub Release without taking the shared Latest marker |
| `v3-pro-release-beta.yml`, `v3-pro-release-stable.yml`, `v3-pro-promote-to-stable.yml` | The independent `nocobase/nocobase3-pro` repository, retaining its `develop` and `main` branches; OSS pins come from `v3-develop` and `v3-main` | The configured private Pro registry                    |

`release-beta/*` and `release/*` remain release candidate branch and aggregate tag names. They are not replacements for the long-lived v3 branches. The Pro submodule path `vendor/nocobase3` remains a directory name, not an OSS repository address.

## Repository configuration to confirm

The source workflows already target the new OSS repository and public npm. Repository-level settings are separate from committed YAML; a maintainer must confirm the following on `nocobase/nocobase` before treating a release as operational. Local checks do not prove that secrets exist or that publishing permissions have been granted.

- The NocoBase GitHub App is installed for `nocobase/nocobase`; `NOCOBASE_APP_ID` and `NOCOBASE_APP_PRIVATE_KEY` are configured, with the contents and pull request permissions the release workflows require. Pro workflows also require App access to the independent Pro repository.
- `NPM_TOKEN` can publish the affected public `@nocobase` packages. Pro uses `PRO_NPM_REGISTRY` and `PRO_NPM_TOKEN` independently and must keep using its private registry.
- Branch protection and required checks refer to the `v3-` workflows and allow the configured release bot's squash merges and synchronization into `v3-develop` and `v3-main`.
- Default-branch dispatch entries are present on `main`, Actions is enabled, and the beta and stable workflows pass with `dry_run: true` before an actual publish. Pro dispatch input descriptions on `main` should name the OSS `v3-develop` / `v3-main` branches; their current descriptions still use the former OSS names, although dispatch already selects `v3-develop`.
- `RELEASE_RESULT_FEISHU_WEBHOOK_URL` is configured if internal release notifications are required.
- Site and UI Library deployment stay gated by `V3_ASSET_DEPLOY_ENABLED`. Confirm the `DOCS_ALI_OSS_*` settings and `DOCS_ALI_CDN_DOMAIN`, then enable the gate when the deployment destination is ready.

## Historical references

Published `CHANGELOG.md` entries and consumed `.changeset/pre/` files retain links to the archived OSS repository as release history. Pro release-note conversion also accepts archived OSS links so those historical notes still point to their Pro source. These references and the independent Pro repository are intentional; current package metadata, installation commands, and usage links must point to `nocobase/nocobase` and select a v3 branch where needed.
