---
name: nocobase-app-upgrade
description: >-
  Use when asked to upgrade NocoBase, its core/kernel/framework or all
  @nocobase packages, or to merge a newer template release ("升级 NocoBase",
  "更新 NocoBase 到最新版"). Also covers explicit Community to Professional or
  Enterprise and Professional to Enterprise ("社区版转专业版", "专业版转企业版").
  Not for feature development, single dependencies or deployed server builds;
  the app installer handles deployed builds.
metadata:
  short-description: Merge a newer template release into this application
---

# Upgrading the application template

`pnpm create @nocobase/app` copies template source. Compare the two published template releases instead of comparing the application to `latest`: only the two releases show what changed upstream. Merge their differences file by file.

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

For a retry, verify the original checkpoint and pinned artifacts and review pending edits before resuming. For a new upgrade, require a clean Git tree (ask the user to commit outstanding work), record `git rev-parse HEAD`, then `git checkout -b template-upgrade-<target>`.

Not a Git project: do not touch it. Offer `git init` plus a commit, or a full copy in a scratch directory to upgrade and verify before moving back. Never proceed with no way back.

## 2. Identify the source

```bash
node -p "JSON.stringify(require('./package.json').nocobase, null, 2)"
```

`templatePackage` is authoritative; `defaultTemplateVersion` is BASE. If the package is missing, infer it from `templateKind`, dependency history and registrations (`"app"` does not distinguish Default from Examples). Confirm it with the user, use it as `BASE_PACKAGE` below and record it after acceptance. Do not substitute another package if the template is discontinued. If BASE is missing or was bumped without a merge, establish it from Git history with the user.

Within an edition, compare releases of the recorded package, using its edition version as BASE. For an explicit Community → Professional/Enterprise or Professional → Enterprise change, follow [switching editions](references/edition-transition.md); select the destination separately and keep the source markers until acceptance.

## 3. Select the release channel and fetch both releases

Resolve TARGET before fetching. Use an explicit version or tag when requested; otherwise use `latest`, regardless of BASE's channel. For an edition change, check the destination's [compatible Default baseline](references/edition-transition.md#select-compatible-artifacts). Within one package, if default `latest` is not newer than BASE, ask before using another tag with a newer release; if none exists, the application is current. State the chosen tag and exact version in the plan.

Before the first stable release, beta releases also move `latest`; afterward `latest` carries stable releases while `beta` follows only during a transition, then stops moving. Following `latest` keeps beta-created applications upgrading. A prerelease on `latest` is expected before a stable release exists; if the user explicitly requests stable, explain that no stable release exists yet and clarify. Never otherwise pick the highest version across tags or substitute for a missing requested tag.

Run from the application root to honor npm's scoped registry settings. Check access to commercial artifacts through the configured `@nocobase:registry`; on failure, restore access and retry the same edition and version.

```bash
# For an edition change, set REQUESTED_TEMPLATE to its full package name.
# Set REQUESTED_VERSION for an exact release or REQUESTED_TAG for a channel.
BASE_PACKAGE=$(node -p "require('./package.json').nocobase.templatePackage")
BASE=$(node -p "require('./package.json').nocobase.defaultTemplateVersion")
TARGET_PACKAGE=${REQUESTED_TEMPLATE:-$BASE_PACKAGE}
if [ -n "${REQUESTED_VERSION:-}" ]; then
  TARGET=$REQUESTED_VERSION
else
  CHANNEL=${REQUESTED_TAG:-latest}
  npm view "$TARGET_PACKAGE" dist-tags --json
  TARGET=$(npm view "$TARGET_PACKAGE@$CHANNEL" version)
fi
```

Within the same package, compare BASE and TARGET by semantic version: equal is a no-op; older is not an upgrade. Across editions compare Default baselines, not edition version numbers. Pin the resolved TARGET throughout, and take dependencies from its manifest, not a shared dist-tag.

```bash
WORK=$(mktemp -d)

fetch_release() {
  local spec=$1 output=$2 archive
  mkdir -p "$output" || return 1
  npm pack "$spec" --ignore-scripts --json --pack-destination "$WORK" > "$output.pack.json" || return 1
  archive=$(node -p 'require(process.argv[1])[0].filename' "$output.pack.json") || return 1
  tar -xzf "$WORK/$archive" -C "$output" --strip-components=1
}
fetch_release "$BASE_PACKAGE@$BASE" "$WORK/base" && fetch_release "$TARGET_PACKAGE@$TARGET" "$WORK/target"
```

Record registries, channel, exact artifact versions, integrity and checkpoints. Stop before editing on missing artifacts or guidance, invalid integrity or an incompatible baseline; do not substitute a checkout or another channel. Tarballs omit unpublished files such as `.gitignore`.

## 3a. Discover the target release’s requirements before editing

Read TARGET's `AGENTS.md` and `README.MD`. Resolve and fetch its `@nocobase/app-skills` through the configured registry, record version and integrity, and read its upgrade Skill and applicable references before planning. Do not install or synchronize it before plan approval.

```bash
SKILLS_RANGE=$(node -p "const p=require('$WORK/target/package.json'); p.devDependencies?.['@nocobase/app-skills'] ?? p.dependencies?.['@nocobase/app-skills'] ?? ''")
# Stop if the target declares no guidance package; do not guess a replacement.
npm pack "@nocobase/app-skills@$SKILLS_RANGE" --ignore-scripts --json --pack-destination "$WORK"
# Extract separately and read skills/nocobase-app-upgrade/ there.
```

When target guidance changes an older workflow, include its requirements in this same upgrade. Use [versioned upgrade verification](references/versioned-upgrade-verification.md) to distinguish candidate-package evidence from verification of a publicly released target.

## 4. Read what changed, and who else changed it

```bash
diff -rq "$WORK/base" "$WORK/target"
```

`Files ... differ` is modified, `Only in TARGET` added, `Only in BASE` removed; read the substantive ones with `diff -u`. [Edge cases](references/edge-cases.md) cover generated configuration, synchronized Skills and migration history the diff cannot describe.

When the upgrade changes application migrations or plugins that supply them, read [database upgrades](references/database-upgrades.md) before starting the target application, and put any checksum correction, data prerequisite and irreversible migration in the recovery plan. A Git branch protects source, not the database.

When BASE → TARGET changes Realtime or notification contracts, form feedback or submission protection, list navigation, list feedback or refresh after writes, System settings or the permission workspace, process UI or lifecycle definitions, application cookies, or introduces the project plugin development Skill, read the matching [version-specific change](references/edge-cases.md#version-specific-changes) and its reference during planning.

Then ask the project which of those files it has also touched:

```bash
diff -rq "$WORK/base" "$WORK/target" \
  | sed -n "s|^Files $WORK/base/\(.*\) and .* differ$|\1|p" \
  | while read -r file; do
      if [ ! -f "$file" ]; then echo "gone:      $file"
      elif diff -q "$WORK/base/$file" "$file" >/dev/null; then echo "untouched: $file"
      else echo "modified:  $file"; fi
    done
```

Show the user this listing, the version range, the manual actions the changed contracts need, every removed `@nocobase/*` package with its usage and proposed retention, migration or removal (step 5), and the rollback. Get agreement on that plan before editing.

## 5. Check what the diff cannot show

Do this before editing, so its findings are in the plan. The template's files are consistent with each other after a change; the user's are not, and no diff points at them.

For every direct `@nocobase/*` package dropped from the manifest and every plugin dropped from a composition root, search application code, configuration, tests and build scripts for its name, imports, services, routes and configuration keys; for plugins also complete the [plugin usage review](references/edge-cases.md#review-a-removed-plugins-usage). With no usage found, propose removal and get the user's confirmation first.

```bash
# For each `Only in BASE` file, and each export that vanished from a surviving file:
grep -hE '^export ' "$WORK/base/<removed-file>"
diff -u "$WORK/base/<file>" "$WORK/target/<file>" | grep -E '^-\s*export '

# Then search the user's own code for every name found:
grep -rn "<name>" client server cli database tests --include='*.ts' --include='*.tsx'
```

A hit outside the template's own files is a decision: migrate to the replacement the target added, agree with the user on what replaces a capability deliberately removed, or keep the package and affected file as application-owned code and say the template no longer maintains them. Changed signatures are the same class of problem — `pnpm typecheck` in step 8 is what catches those.

## 6. Work through the files

For each file read three versions — `$WORK/base/<file>`, `$WORK/target/<file>`, and the project's — then write the result with Edit.

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

Check [plugin and driver placement](references/edge-cases.md#preinstalled-plugins-and-database-drivers) against the CLI and build, and follow any [global plugin Skill migration](references/plugin-development-skill.md) after sync. Complete [database upgrade checks](references/database-upgrades.md) before startup against retained data; startup can apply migrations automatically.

Run the application: verify sign-in, custom pages, navigation, locale switching, migrations and applicable [version-specific acceptance](references/edge-cases.md#version-specific-changes). Verify target runtime contracts, installed Registry copies and request owners for both template and custom lists. Compare retained records, approval history, permissions and executed migrations against the checkpoint. If a required check fails, keep BASE and report recovery steps.

Only then set `defaultTemplateVersion` to exact TARGET. For edition templates, record the [accepted edition markers](references/edition-transition.md#acceptance-retry-and-completion) from TARGET. Verify the manifest and lockfile and commit them with the reconciled source. Report registries, channel, artifact versions and integrity, conflict decisions, manual steps and checks, candidate versus published status, and rollback.

## Crossing several releases

Compare BASE directly with TARGET and merge once. If a compatibility step cannot be determined from the endpoints, inspect the intermediate release or ask; do not assume every historical instruction applies.
