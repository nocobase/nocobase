---
name: nocobase-app-upgrade
description: >-
  Upgrade this application to a newer release of the template it was generated
  from. Use when the user asks to upgrade the template, pull in template
  changes, move to a newer template version, or reconcile the application with
  upstream. Do not use for ordinary feature development or for upgrading a
  single dependency.
metadata:
  short-description: Merge a newer template release into this application
---

# Upgrading the application template

`pnpm create @nocobase/app` copied a template into the user's hands and left no link back to it, so a newer template release arrives only by someone merging it in.

The difficulty is telling the template's changes from the user's. Comparing the application against the latest template cannot: a file that differs may have been changed by either side, or both. So compare the two template _releases_ instead — the baseline already merged and the target — and decide file by file how each of their differences lands here.

```text
BASE     nocobase.defaultTemplateVersion — the release already merged in
TARGET   the release being moved to
PROJECT  the application as the user has it now

BASE → TARGET    what the template changed — the work to bring in
BASE → PROJECT   what the user changed — the work that must survive
```

`defaultTemplateVersion` is not the application's `version`. It records how far template source has been merged, and moves only after a merge actually happens.

The diff is information. Decide each file yourself and write every edit by hand — a text-merge tool applied to the project would reconcile only what its hunks happen to touch, leaving the user's own files unexamined and step 5 undone.

Never: overwrite the application with a fresh template copy; bump `defaultTemplateVersion` without merging the source; resolve a conflict by discarding the user's side; run `git checkout --`, `git restore`, `git reset --hard`, `git stash`, `git clean`, or `rm -rf` against the working tree; regenerate with `create-app` and copy the user's code across.

## 1. Secure a way back

Git project: require a clean tree (ask the user to commit anything outstanding — do not stash or commit it for them), record `git rev-parse HEAD`, then `git checkout -b template-upgrade-<target>`. Editing the project directly is safe on a branch, and it is what lets `typecheck`/`test`/`build` actually run.

Not a Git project: do not touch it. Offer `git init` plus a commit, or a full copy in a scratch directory to upgrade and verify before moving back. Never proceed with no way back.

## 2. Identify the source

```bash
node -p "JSON.stringify(require('./package.json').nocobase, null, 2)"
```

`templatePackage` names the template; `defaultTemplateVersion` is BASE. Treat that package name as authoritative even when it names a template this Skill has never seen. If it is missing, the application predates the field: inspect `templateKind`, dependency history, plugin registrations, database directories, and published template versions, then confirm the source package before fetching. `templateKind: "app"` alone does not distinguish Default from Examples, while `templateKind: "hub"` identifies the discontinued Hub template, which has no newer version to upgrade to: tell the user rather than picking another template as BASE. If `defaultTemplateVersion` itself is missing or was bumped without a merge, the baseline is unknown — work it out with the user from Git history rather than guessing, since too old a baseline replays changes already present and too new a one skips changes never applied.

If `nocobase.templatePackage` is missing, use the confirmed package name for `TEMPLATE` instead of the manifest lookup below, then record it in the manifest during the agreed source merge.

## 3. Select the release channel and fetch both releases

Resolve the user's requested channel before choosing TARGET. An explicit version takes precedence. For a beta upgrade, use the template's `beta` dist-tag; for an explicit `latest` upgrade, use its `latest` dist-tag. If the user only asks to upgrade, retain the baseline's channel: use `beta` for a beta baseline and `latest` for a stable baseline; clarify other prerelease channels instead of guessing. State the selected channel and resolved version in the upgrade plan.

The tags are independent pointers, not a version ordering: `beta` tracks beta releases, while `latest` is npm's default tag and can still point to an older beta before a stable release exists. Do not assume `latest` is newer or stable, or choose the highest version across all channels. If the user asks for a stable release but `latest` resolves to a prerelease, explain that the tag does not provide a stable target and clarify before proceeding. A missing requested tag is not permission to fall back to another channel.

```bash
REGISTRY=https://registry.npmjs.org
TEMPLATE=$(node -p "require('./package.json').nocobase.templatePackage")
BASE=$(node -p "require('./package.json').nocobase.defaultTemplateVersion")
npm view "$TEMPLATE" dist-tags --json --registry="$REGISTRY"

# Set CHANNEL to beta or latest according to the selection above.
CHANNEL=beta
TARGET=$(npm view "$TEMPLATE@$CHANNEL" version --registry="$REGISTRY")
# For an explicitly requested version, assign that exact version to TARGET instead.
```

Use semantic version ordering to compare the resolved TARGET with BASE. If equal, there is no template upgrade; if older, report the result rather than performing an implicit downgrade. Resolve a tag once, then use that exact version for fetching, the source diff and `defaultTemplateVersion`, even if the tag moves during the upgrade. Fetch dependencies from the target template's manifest; do not independently move every `@nocobase/*` dependency to a dist-tag, since packages have separate versions and release schedules.

```bash
WORK=$(mktemp -d)

for VERSION in "$BASE" "$TARGET"; do
  npm pack "$TEMPLATE@$VERSION" --registry="$REGISTRY" --pack-destination "$WORK" >/dev/null
  mkdir -p "$WORK/$VERSION"
  tar -xzf "$WORK"/*"-$VERSION.tgz" -C "$WORK/$VERSION" --strip-components=1
done
```

These are published tarballs, not Git checkouts — they carry only what `files` publishes, and npm never publishes `.gitignore`. That is fine: both sides are missing the same things.

## 4. Read what changed, and who else changed it

```bash
diff -rq "$WORK/$BASE" "$WORK/$TARGET"
```

`Files ... differ` is modified, `Only in TARGET` added, `Only in BASE` removed. Read the substantive ones with `diff -u`. Use the actual BASE → TARGET changes and the project's current state to decide what applies. The target template's `@nocobase/app-skills` dependency identifies the shared guidance shipped for that release; inspect that package's relevant references when a changed framework contract needs explanation. Check [edge cases](references/edge-cases.md) for generated configuration, synchronized Skills, and migration history that the template diff cannot describe.

Then ask the project which of those files it has also touched:

```bash
diff -rq "$WORK/$BASE" "$WORK/$TARGET" \
  | sed -n "s|^Files $WORK/$BASE/\(.*\) and .* differ$|\1|p" \
  | while read -r file; do
      if [ ! -f "$file" ]; then echo "gone:      $file"
      elif diff -q "$WORK/$BASE/$file" "$file" >/dev/null; then echo "untouched: $file"
      else echo "modified:  $file"; fi
    done
```

Show the user this listing, the version range, any manual actions identified from the changed contracts and project state, the removals from step 5, and the rollback. Include every removed `@nocobase/*` package, the application references and capabilities it supplies, and the proposed retention, migration, or removal. Get agreement on that plan before editing.

## 5. Check what the diff cannot show

Do this before editing, so its findings are in the plan. The template's files are consistent with each other after a change; the user's are not, and no diff points at them.

Check every direct `@nocobase/*` package dropped from the manifest, and check plugins dropped from any composition root even when the application never changed those files. Search application code, configuration, tests, and build scripts for the package name, imports, exports, services, routes, configuration keys, and other public contracts. For plugins, also complete the [plugin usage review](references/edge-cases.md#review-a-removed-plugins-usage). When no usage is found, propose removal and obtain the user's confirmation before invoking the removal command; the command does not rewrite business code or configuration.

```bash
# For each `Only in BASE` file, and each export that vanished from a surviving file:
grep -hE '^export ' "$WORK/$BASE/<removed-file>"
diff -u "$WORK/$BASE/<file>" "$WORK/$TARGET/<file>" | grep -E '^-\s*export '

# Then search the user's own code for every name found:
grep -rn "<name>" client server cli database tests --include='*.ts' --include='*.tsx'
```

A hit outside the template's own files is a decision: migrate to the replacement the target added, agree with the user on what replaces a capability deliberately removed, or keep the package and affected file as application-owned code and say the template no longer maintains them. Changed signatures are the same class of problem — `pnpm typecheck` in step 8 is what catches those.

## 6. Work through the files

For each file read three versions — `$WORK/$BASE/<file>`, `$WORK/$TARGET/<file>`, and the project's — then write the result with Edit.

- **Untouched by the user** — take the template's version for ordinary source. Manifests and plugin composition roots follow the edge-case rules, including the usage review from step 5, even when unchanged. Most ordinary files, including `client/components/ui/` shadcn primitives, belong here.
- **Both changed it** — express what the template was trying to achieve inside the user's version. Their code exists for a reason, so this is a merge of two intents, not a choice between them. If the template's change makes their customization unnecessary, say so rather than deleting it.
- **Template added a file** — copy it in; if something already exists at that path, reconcile rather than overwrite.
- **Template removed a file** — only after step 5.

The generator rewrites template identity into some files, so those files legitimately differ from both releases. Current candidates include `client/runtime.ts`, `client/service-provider.ts`, and the Examples template's `server/providers/app-example.ts`; inspect the project and generator behavior instead of treating this as an exhaustive list for future templates. Keep the application's name when taking a template change there — copying verbatim splits the i18n namespace. When a target removes one of these files, preserve any application-owned customization until step 5 establishes that it is unused or migrated.

A template upgrade is not a theme reset. Preserve application-owned visual customizations by default; apply non-conflicting presentation changes and obtain a decision before replacing a customized visual result. For theme or shell deltas, inspect the [theme upgrade checks](references/theme-upgrade.md) during planning and merging, not only at final verification. An explicit request to adopt the new default theme authorizes replacement only within the agreed visual scope.

When the right answer is unclear, stop and ask. The user is the only one who knows why their code is the way it is.

## 7. Reconcile what is not ordinary source

`package.json`, generated configuration, synchronized Skills, and the plugin composition roots have their own rules — see [edge cases](references/edge-cases.md). For each user-confirmed `@nocobase/*` removal, run `pnpm nocobase package remove @nocobase/example` while the dependency is still declared, so the package manager updates the manifest and lockfile and the CLI cleans its Skills and plugin registrations. Do not delete only its manifest key; the edge-case reference covers older CLI versions and already-removed dependencies.

## 8. Finish

Set `defaultTemplateVersion` to the target, now that the source is actually merged.

```bash
pnpm install && pnpm dedupe && pnpm nocobase skills sync
pnpm typecheck && pnpm test && pnpm lint && pnpm build
```

`pnpm install` can retain older transitive dependencies in `pnpm-lock.yaml` even after the template raises a direct dependency. Run `pnpm dedupe` to refresh compatible resolutions before synchronizing Skills from the final `node_modules`. Review and include the resulting lockfile changes in the upgrade. If type checking still reports incompatible types from two versions of the same package, follow [dependency resolution conflicts](references/edge-cases.md#dependency-resolution-conflicts) before changing application code.

`typecheck` is doing real work here — it catches the broken import a removal left behind. Then run the application and check what the delta touched: sign-in, the user's pages, navigation, locale switching, any new migration. Passing commands are not evidence the application still behaves. For a theme or shell change, also complete the [theme upgrade checks](references/theme-upgrade.md); token changes alone do not verify the application-owned consumers.

Report the range merged, how each contested file was decided, any manual actions and their validation, and how to roll back.

## Crossing several releases

Compare BASE directly with TARGET and merge the resulting changes once. Check the user's code against changed or removed contracts and preserve existing configuration, data, and migration history. If a compatibility step cannot be determined from the endpoints, inspect the relevant intermediate release or ask for the missing project context; do not assume every historical instruction applies.
