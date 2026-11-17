---
name: nocobase-app-upgrade
description: >-
  Upgrade this application to a newer release of the template it was generated
  from, which is how this application moves to a newer NocoBase version. Users
  rarely think in terms of templates, so use it whenever the user asks to
  upgrade or update NocoBase, the NocoBase core, kernel or framework version,
  or the @nocobase packages as a whole — for example "upgrade NocoBase",
  "update the NocoBase core version", "move to the latest NocoBase release",
  "升级 NocoBase", "升级 NocoBase 内核版本", "更新 NocoBase 到最新版" — as well as
  when they ask to upgrade the template, pull in template changes, move to a
  newer template version, or reconcile the application with upstream. Do not
  use for ordinary feature development, for upgrading a single dependency, or
  for upgrading an already deployed build on a server, which the app installer
  handles.
metadata:
  short-description: Merge a newer template release into this application
---

# Upgrading the application template

`pnpm create @nocobase/app` copied a template into the user's hands and left no link back to it, so a newer template release arrives only by someone merging it in.

Comparing the application against the latest template cannot tell the template's changes from the user's. Compare the two template _releases_ instead — the baseline already merged and the target — and decide file by file how each difference lands here.

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

Git project: require a clean tree (ask the user to commit anything outstanding; do not stash or commit it for them), record `git rev-parse HEAD`, then `git checkout -b template-upgrade-<target>` and edit the project directly.

Not a Git project: do not touch it. Offer `git init` plus a commit, or a full copy in a scratch directory to upgrade and verify before moving back. Never proceed with no way back.

## 2. Identify the source

```bash
node -p "JSON.stringify(require('./package.json').nocobase, null, 2)"
```

`templatePackage` names the template, authoritative even for a template this Skill has never seen; `defaultTemplateVersion` is BASE. If `templatePackage` is missing, the application predates it: infer the package from `templateKind` (`"app"` alone does not distinguish Default from Examples), dependency history and plugin registrations, confirm it with the user, use it as `TEMPLATE` below, and record it in the manifest during the merge. If `defaultTemplateVersion` is missing or was bumped without a merge, work out the baseline with the user from Git history: too old replays changes already present, too new skips changes never applied.

## 3. Select the release channel and fetch both releases

Resolve TARGET before fetching. An explicit version takes precedence, and an explicitly requested dist-tag, such as `beta`, uses that tag. If the user only asks to upgrade, prefer `latest` whatever release BASE came from: when `latest` resolves to a version newer than BASE by semantic version ordering, that version is TARGET. When it does not, and another dist-tag points to a version newer than BASE, name the tag and its version and ask before using it, since it is a prerelease line the user did not ask for; when no tag does, the application is already current. State the selected tag and resolved version in the upgrade plan.

Before the first stable release, beta releases also move `latest`; afterward `latest` carries stable releases while `beta` follows only during a transition, then stops moving. Following `latest` keeps beta-created applications upgrading. A prerelease on `latest` is expected before a stable release exists; if the user explicitly requests stable, explain that no stable release exists yet and clarify. Never otherwise pick the highest version across tags or substitute for a missing requested tag.

```bash
REGISTRY=https://registry.npmjs.org
TEMPLATE=$(node -p "require('./package.json').nocobase.templatePackage")
BASE=$(node -p "require('./package.json').nocobase.defaultTemplateVersion")
npm view "$TEMPLATE" dist-tags --json --registry="$REGISTRY"

# Keep latest unless the selection above chose another tag.
CHANNEL=latest
TARGET=$(npm view "$TEMPLATE@$CHANNEL" version --registry="$REGISTRY")
# For an explicitly requested version, assign that exact version to TARGET instead.
```

If TARGET equals BASE there is nothing to upgrade; if it is older, report it rather than downgrading. Resolve the tag once and use that exact version for fetching, the diff and `defaultTemplateVersion`. Take dependencies from the target template's manifest; never move every `@nocobase/*` package to a dist-tag.

```bash
WORK=$(mktemp -d)

for VERSION in "$BASE" "$TARGET"; do
  npm pack "$TEMPLATE@$VERSION" --registry="$REGISTRY" --pack-destination "$WORK" >/dev/null
  mkdir -p "$WORK/$VERSION"
  tar -xzf "$WORK"/*"-$VERSION.tgz" -C "$WORK/$VERSION" --strip-components=1
done
```

Record the registry, channel, exact BASE/TARGET versions and tarball integrity. A missing target or guidance package, invalid integrity, or a target not newer than BASE stops the upgrade before any edit; never substitute a Git checkout or another channel. Both tarballs miss the same unpublished files, such as `.gitignore`.

## 3a. Discover the target release’s requirements before editing

Read TARGET's `AGENTS.md` and `README.MD`; they can add mandatory requirements. Fetch the `@nocobase/app-skills` its manifest resolves to, record version and integrity, and read its upgrade Skill and applicable references before planning, without installing it.

```bash
SKILLS_RANGE=$(node -p "const p=require('$WORK/$TARGET/package.json'); p.devDependencies?.['@nocobase/app-skills'] ?? p.dependencies?.['@nocobase/app-skills'] ?? ''")
# Stop if the target declares no guidance package; do not guess a replacement.
npm pack "@nocobase/app-skills@$SKILLS_RANGE" --registry="$REGISTRY" --ignore-scripts --json --pack-destination "$WORK"
# Extract it into its own directory and read skills/nocobase-app-upgrade/ there.
```

When target guidance changes an older workflow, include its requirements in this same upgrade. Use [versioned upgrade verification](references/versioned-upgrade-verification.md) to distinguish candidate-package evidence from verification of a publicly released target.

## 4. Read what changed, and who else changed it

```bash
diff -rq "$WORK/$BASE" "$WORK/$TARGET"
```

`Files ... differ` is modified, `Only in TARGET` added, `Only in BASE` removed; read the substantive ones with `diff -u`. [Edge cases](references/edge-cases.md) cover generated configuration, synchronized Skills and migration history the diff cannot describe.

When the upgrade changes application migrations or plugins that supply them, read [database upgrades](references/database-upgrades.md) before starting the target application, and put any checksum correction, data prerequisite and irreversible migration in the recovery plan. A Git branch protects source, not the database.

When BASE → TARGET changes Realtime or notification contracts, form feedback or submission protection, list navigation, list feedback or refresh after writes, System settings or the permission workspace, process UI or lifecycle definitions, application cookies, or introduces the project plugin development Skill, read the matching [version-specific change](references/edge-cases.md#version-specific-changes) and its reference during planning.

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

Show the user this listing, the version range, the manual actions the changed contracts need, every removed `@nocobase/*` package with its usage and proposed retention, migration or removal (step 5), and the rollback. Get agreement on that plan before editing.

## 5. Check what the diff cannot show

Do this before editing, so its findings are in the plan. The template's files are consistent with each other after a change; the user's are not, and no diff points at them.

For every direct `@nocobase/*` package dropped from the manifest and every plugin dropped from a composition root, search application code, configuration, tests and build scripts for its name, imports, services, routes and configuration keys; for plugins also complete the [plugin usage review](references/edge-cases.md#review-a-removed-plugins-usage). With no usage found, propose removal and get the user's confirmation first.

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

The generator writes the application's identity into some files, such as `client/runtime.ts`, `client/service-provider.ts` and the Examples template's `server/providers/app-example.ts`, so they differ from both releases. Keep the application's name when taking a change there; copying verbatim splits the i18n namespace.

A template upgrade is not a theme reset. Preserve application-owned visual customizations; apply non-conflicting presentation changes and ask before replacing a customized visual result. For theme or shell changes, use the [theme upgrade checks](references/theme-upgrade.md) while planning and merging.

When the right answer is unclear, stop and ask about the concrete conflict and options, keeping the unresolved files, the recovery checkpoint and `defaultTemplateVersion` at BASE. Resume the same upgrade after the decision; never silently discard a business customization.

## 7. Reconcile what is not ordinary source

`package.json`, generated configuration, synchronized Skills and the plugin composition roots follow [edge cases](references/edge-cases.md). Remove each user-confirmed `@nocobase/*` package with `pnpm nocobase package remove <package>` while it is still declared, which also cleans its Skills and plugin registrations; never delete only its manifest key.

## 8. Finish

Keep `defaultTemplateVersion` at BASE while validating: it is a completion record. Unresolved conflicts, missing target requirements or a failed check never advance it or produce a completion report.

```bash
pnpm install && pnpm dedupe && pnpm nocobase skills sync
pnpm typecheck && pnpm test && pnpm lint && pnpm build
```

`pnpm dedupe` refreshes transitive resolutions `pnpm install` keeps; include the resulting lockfile changes. If type checking still reports two versions of the same package, follow [dependency resolution conflicts](references/edge-cases.md#dependency-resolution-conflicts) before changing application code.

`typecheck` catches the broken import a removal left behind. Before starting the application against retained data, complete the applicable [database upgrade checks](references/database-upgrades.md); startup may apply migrations automatically. Then run the application and check what the delta touched: sign-in, the user's pages, navigation, locale switching, any new migration, and the acceptance checks of every [version-specific change](references/edge-cases.md#version-specific-changes) in the range. Passing commands are not evidence the application still behaves.

Before declaring completion, verify that the resolved runtime exports the target contracts, copied components, installed Registry copies and every template and application-owned request owner are connected, and compare retained records, approval history, permissions and executed migration sources against the recovery checkpoint. If any required check fails, keep BASE and report the failure with recovery instructions.

Only then set `defaultTemplateVersion` to the exact TARGET and commit the reconciled source, dependencies and marker together. Report the registry and channel, exact template and guidance versions with integrity, how each contested file was decided, manual actions and their validation, whether the target is a local candidate or a published package, and how to roll back.

## Crossing several releases

Compare BASE directly with TARGET and merge once. If a compatibility step cannot be determined from the endpoints, inspect the intermediate release or ask; do not assume every historical instruction applies.
