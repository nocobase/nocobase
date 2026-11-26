# Migrate a retired scenario template to Enterprise

Use this procedure for applications whose `nocobase.templatePackage` names one of these packages. An ordinary NocoBase upgrade request for one of these applications leads to Enterprise, which now provides its original capability. Explain this edition change and obtain agreement before applying it.

| Original template                     | Capability     |
| ------------------------------------- | -------------- |
| `@nocobase/app-template-multi-app`    | `multi-app`    |
| `@nocobase/app-template-sub-app`      | `sub-app`      |
| `@nocobase/app-template-multi-portal` | `multi-portal` |

## Identify both releases

Record the current Git commit and check that the application tree is clean. Read the original package and `nocobase.defaultTemplateVersion`. Some published Main packages record `0.1.0-beta.0` in that field across distinct releases, including standalone Main packages. For those, establish the exact original package version from a record of the application's creation, never from a comparison:

- **The creation commit.** `create-app` keeps the template's own `version` in the generated `package.json` as the record of the release the application came from. Find the commit that introduced `nocobase.templatePackage` (`git log --diff-filter=A --format=%H -- package.json | tail -1`, then confirm the field is present in it) and read `version` there. It counts only when that commit names the same original package and its `version` is a published release of it (`npm view "$PACKAGE@$VERSION" version` with the commercial registry arguments below). The application's current `version` can change independently and is not evidence.
- **A saved original archive** whose integrity equals the registry's `dist.integrity` for one release.
- **A creation or deployment record** that names the exact package version, such as the recorded `pnpm create @nocobase/app` command or a release note of the project.

Dependency versions in the creation commit and preview results only corroborate the recorded release; they never select or replace it. A wrong candidate can match the creation commit's `@nocobase/*` versions exactly and preview with zero conflicts, when the project pinned those versions before its first commit. Applying it would silently overwrite the pinned versions. For example, an application created from Main `0.1.0-beta.5` whose first commit already pinned four `@nocobase/*` dependencies to the next release's versions matches `0.1.0-beta.6` and previews cleanly against it, while `0.1.0-beta.5` reports those four dependencies as conflicts. The creation record names `0.1.0-beta.5`; migrate from it and resolve the four conflicts with the user. When the corroboration disagrees with the record, report the difference in the plan.

If no record establishes one version, for example when the history was squashed, the creation commit is missing or its `version` was edited, stop before creating a branch or writing anything. Explain that matching dependencies or a clean preview cannot identify the original release, and ask for the provenance or the original archive.

A preview runs only for the recorded release. If the original archive cannot be fetched, stop before writing anything.

Use the [commercial registry access procedure](edition-transition.md#check-commercial-registry-access) for **both** packages. From the application root, use the existing npm authentication and `--@nocobase:registry=https://pkg-v3.nocobase.com/`, with no credentials in commands or output. Resolve the selected Enterprise tag (default `latest`) to an exact version. Confirm fresh read access, pack the exact original and Enterprise releases, and extract them separately using the `fetch_release` function in the main Skill. Record their versions and integrity. If access is denied or the exact original archive is unavailable, stop before creating a branch or changing any project files. Ask for authorized access or the matching, verifiable archive.

Read Enterprise's `AGENTS.md`, `README.MD` and declared `@nocobase/app-skills` release before planning. Confirm the extracted target includes `scripts/app-capability.mjs` and the `presets/` bundle. Keep the two extracted releases outside the application. Compare the original and target sources and plugin release notes when the source uses a different runtime or database contract.

## Preview and confirm the migration

Run the target release's script from the application root. Set `CAPABILITY` to the original capability from the table and `BASE` to the verified original package version. Pass `--from-version` with the recorded release for a Main project with the shared `0.1.0-beta.0` marker, even if that release is also `0.1.0-beta.0`.

```bash
node "$WORK/target/scripts/app-capability.mjs" "$CAPABILITY" --app . \
  --from "$WORK/base" --from-version "$BASE"
```

Review the preview's `created`, `updated`, `deleted`, `renamed`, `tool` and `conflicts`. Any conflict stops the migration before writes. A conflict that stands for an application registration, such as an installed portal in `client/plugins.ts` or `server/plugins.ts`, is resolved by merging that file by hand, keeping both the application's entries and the Enterprise release's, in a reviewed commit on the upgrade branch. Rerun the preview with `--keep <file>` for each hand-merged file, which leaves it unchanged and lists it under `kept`; it refuses a name that is not a conflict. A conflict on a `dependencies` or `devDependencies` entry means the project pinned that version itself. Show the original, Enterprise and project versions, agree the version with the user (normally the Enterprise release's, which its plugins are built against), write it into `package.json` in a reviewed commit on the upgrade branch and rerun the preview. Any other conflict still stops the migration. Show the conflicting path, the original and Enterprise changes, and the application customization. Agree on how to retain that customization, with a clean preview before applying. A separately reviewed scratch migration can show the desired changes for a three-way reconciliation. Keep the project's changes recoverable throughout and keep the published archive and its preset digests intact.

For Main, include the existing CLI and identity-provider settings, public origin and base path, host node IDs, host directories, archives and volumes in the plan. Read the Enterprise guide for old nested `deployment.nodes.<id>.local` settings and preserve each existing node's values when its configuration shape changes. For a child, keep the same platform registration, callback and credentials, database and storage. For portals, keep the installed portal packages, their package names and entry paths, metadata, grants and database histories. Follow [database upgrades](database-upgrades.md) for snapshots, pending tasks and historical checksums. Keep the live stores out of the migration checkout.

Portals generated by the retired Multi-portal template use the earlier portal contract: a shared `portal.ts` descriptor and imports such as `@nocobase/app-plugin-multi-portal/client/workspace`, which the Enterprise release's plugin no longer exports. They fail type checking and the build until migrated, so include each portal's migration in the plan and commit it on the upgrade branch after applying the tool. Follow the "Existing portals" steps in the plugin's `docs/integration.md`, read from the Enterprise release's package; the release's `create-portal` output shows the target shape. Keep the package name, which is the portal id, so the installation state carries over. Keep each route `name` equal to the module key it replaces, or declare `group` with that key, so stored grants still apply. Leave executed migrations and seeds byte for byte unchanged. When an executed seed imports `portal.ts`, keep a file at that path that exports `portalFromPackage(manifest)`. Set the portal package's `peerDependencies` on NocoBase packages to the versions the application now declares.

Create the upgrade branch before presenting the plan and wait for the user's approval. Include proposed capability combinations separately. The original capability is retained, and the supported additions are `multi-app+multi-portal` and `sub-app+multi-portal`.

## Apply and verify

After a clean preview and approval, rerun the same command with `--apply`. The tool updates the Enterprise manifest and copies the target tool and presets on the upgrade branch. Verify `nocobase.templatePackage`, `edition`, `defaultTemplateVersion` and `capabilities` against the selected release and original capability. Review every edit and confirm the application name, business sources, configuration, database tasks and storage paths are preserved. Synchronize dependencies and Skills with `pnpm install`, `pnpm dedupe` and `pnpm nocobase skills sync`. Run `pnpm nocobase config check`, `pnpm typecheck`, `pnpm test` and `pnpm build`. Leave the upgrade branch unaccepted if any check fails.

On isolated copies of retained data and storage, verify Main still manages and enters its original child instances, a child can still sign in through that platform, or an installed portal still opens from My portals, as applicable. Verify existing records, grants and file references. Preview an approved additional capability with `pnpm app:enable` and validate both capabilities after applying it. Commit the verified upgrade and keep the source checkpoint, artifact versions and matching data backup together for recovery.
