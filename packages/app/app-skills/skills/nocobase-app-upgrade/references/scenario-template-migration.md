# Migrate a retired scenario template to Enterprise

Use this procedure for applications whose `nocobase.templatePackage` names one of these packages. An ordinary NocoBase upgrade request for one of these applications leads to Enterprise, which now provides its original capability. Explain this edition change and obtain agreement before applying it.

| Original template                     | Capability     |
| ------------------------------------- | -------------- |
| `@nocobase/app-template-multi-app`    | `multi-app`    |
| `@nocobase/app-template-sub-app`      | `sub-app`      |
| `@nocobase/app-template-multi-portal` | `multi-portal` |

## Identify both releases

Record the current Git commit and check that the application tree is clean. Read the original package and `nocobase.defaultTemplateVersion`. Some published Main packages record `0.1.0-beta.0` in that field across distinct releases, including standalone Main packages. Recover the exact original package version from evidence that traces back to the application's creation: the creation commit's manifest, a saved artifact or archive checksum, or a deployment record. The application's current `version` can change independently. When the field alone does not settle it (the shared `0.1.0-beta.0` marker), fingerprint the creation commit: its `package.json` carries the template's `@nocobase/*` dependency versions, resolved when the project was created. Find the commit that introduced `nocobase.templatePackage` (`git log --diff-filter=A --format=%H -- package.json | tail -1`) and compare its `@nocobase/*` entries with each published candidate (`npm view "$PACKAGE@$VERSION" dependencies devDependencies --json`, with the commercial registry arguments below). Keep the candidate whose entries all match the creation commit and name it as the original; if none or several match, or the creation commit already carries edits to those entries, stop and ask for the provenance.

A preview never selects the original release. Use it only to reject a candidate that reports many conflicts, because a wrong candidate can also preview with zero conflicts and then overwrite dependency versions the project had pinned itself. Run the preview below for the traced candidate only. If the evidence does not settle one version, or the original archive cannot be fetched, stop before writing anything and ask for the provenance.

Use the [commercial registry access procedure](edition-transition.md#check-commercial-registry-access) for **both** packages. From the application root, use the existing npm authentication and `--@nocobase:registry=https://pkg-v3.nocobase.com/`, with no credentials in commands or output. Resolve the selected Enterprise tag (default `latest`) to an exact version. Confirm fresh read access, pack the exact original and Enterprise releases, and extract them separately using the `fetch_release` function in the main Skill. Record their versions and integrity. If access is denied or the exact original archive is unavailable, stop before creating a branch or changing any project files. Ask for authorized access or the matching, verifiable archive.

Read Enterprise's `AGENTS.md`, `README.MD` and declared `@nocobase/app-skills` release before planning. Confirm the extracted target includes `scripts/app-capability.mjs` and the `presets/` bundle. Keep the two extracted releases outside the application. Compare the original and target sources and plugin release notes when the source uses a different runtime or database contract.

## Preview and confirm the migration

Run the target release's script from the application root. Set `CAPABILITY` to the original capability from the table and `BASE` to the verified original package version. Pass `--from-version` for a Main project with the shared `0.1.0-beta.0` marker, even if the verified package version is also `0.1.0-beta.0`.

```bash
node "$WORK/target/scripts/app-capability.mjs" "$CAPABILITY" --app . \
  --from "$WORK/base" --from-version "$BASE"
```

Review the preview's `created`, `updated`, `deleted`, `renamed`, `tool` and `conflicts`. Any conflict stops the migration before writes. Show the conflicting path, the original and Enterprise changes, and the application customization. Agree on how to retain that customization, with a clean preview before applying. A separately reviewed scratch migration can show the desired changes for a three-way reconciliation. Keep the project's changes recoverable throughout and keep the published archive and its preset digests intact.

For Main, include the existing CLI and identity-provider settings, public origin and base path, host node IDs, host directories, archives and volumes in the plan. Read the Enterprise guide for old nested `deployment.nodes.<id>.local` settings and preserve each existing node's values when its configuration shape changes. For a child, keep the same platform registration, callback and credentials, database and storage. For portals, keep the installed portal sources, metadata, entry paths and grants. Check application-owned imports and routes if the target changes the portal layout contract. Follow [database upgrades](database-upgrades.md) for snapshots, pending tasks and historical checksums. Keep the live stores out of the migration checkout.

Create the upgrade branch before presenting the plan and wait for the user's approval. Include proposed capability combinations separately. The original capability is retained, and the supported additions are `multi-app+multi-portal` and `sub-app+multi-portal`.

## Apply and verify

After a clean preview and approval, rerun the same command with `--apply`. The tool updates the Enterprise manifest and copies the target tool and presets on the upgrade branch. Verify `nocobase.templatePackage`, `edition`, `defaultTemplateVersion` and `capabilities` against the selected release and original capability. Review every edit and confirm the application name, business sources, configuration, database tasks and storage paths are preserved. Synchronize dependencies and Skills with `pnpm install`, `pnpm dedupe` and `pnpm nocobase skills sync`. Run `pnpm nocobase config check`, `pnpm typecheck`, `pnpm test` and `pnpm build`. Leave the upgrade branch unaccepted if any check fails.

On isolated copies of retained data and storage, verify Main still manages and enters its original child instances, a child can still sign in through that platform, or an installed portal still opens from My portals, as applicable. Verify existing records, grants and file references. Preview an approved additional capability with `pnpm app:enable` and validate both capabilities after applying it. Commit the verified upgrade and keep the source checkpoint, artifact versions and matching data backup together for recovery.
