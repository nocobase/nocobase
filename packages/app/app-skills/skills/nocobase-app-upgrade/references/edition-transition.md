# Switching editions in an existing application

Use this workflow when the user explicitly chooses a higher edition. Community here means `@nocobase/app-template-default`. Professional and Enterprise use `@nocobase/app-template-pro` and `@nocobase/app-template-enterprise`. The supported transitions are Default → Pro, Default → Enterprise directly, and Pro → Enterprise. An ordinary upgrade stays on the recorded package. Examples, Multi App and other specialized templates have their own source and data contracts.

## Select compatible artifacts

1. Read the current package and release from the project's `nocobase.templatePackage` and `defaultTemplateVersion`. A manually installed commercial plugin does not establish the edition. If the source identity is missing, reconstruct it from project history before selecting BASE. Keep the full source identity as the recovery checkpoint.
2. Select the requested destination package separately. Fetch the exact source and destination artifacts into the separate `base` and `target` directories in step 3, even when their versions are identical. Check the configured scoped registry and read access to the needed commercial packages and versions before editing. Installation access and any entitlements required by a retained plugin are separate from the template marker.
3. Establish the underlying Default revision on both sides. For Community use the published Default artifact's version and, where needed, its Git revision or source contents. For commercial editions use the composed template's `upstreamTemplateVersion` and `upstreamTemplateCommit`. Commercial package release numbers advance independently of Default and of each other. Equal Default sources allow a change of edition alone. A newer compatible Default also requires the normal upstream source and database upgrade review. If the target has an older Default, stop and select an edition release built on the same or a newer compatible Default. If ancestry is ambiguous, establish the source provenance before editing. When Default versions match but revisions differ, compare the actual baseline sources; a version string alone cannot establish equivalence.
4. Compare the two composed artifacts with PROJECT. In generated files such as `client/runtime.ts` and `client/service-provider.ts`, account for the template name already rewritten to the application's package name. Keep the application's names, namespaces, custom pages, configuration, secrets, migration owners and executed task checksums. Reconcile genuine target changes separately from generated name substitutions.

## Reconcile the project's actual plugin and database state

Follow [preinstalled plugins and database drivers](edge-cases.md#preinstalled-plugins-and-database-drivers) to reconcile the target manifest with the project's active and preinstalled capabilities. Apply [database upgrade tasks](database-upgrades.md) only for separately identified runtime or plugin changes.

## Acceptance, retry and completion

Run the [upgrade finish checks](../SKILL.md#8-finish), including verification of a customized page and retained business records. If the project already uses Approval, open an existing approval and verify its task and history retain their original identifiers and permissions.

Keep all original template markers until acceptance succeeds. Record the exact source and target artifacts with the upgrade branch and starting commit. On failure, report the failed check and keep the same BASE and selected TARGET for retry. Resume by comparing the current files and lockfile against the checkpoint; reuse already-applied edits. After success, write the destination package name, its edition, its own exact release in `defaultTemplateVersion`, and its Default version and commit together with the verified changes. A repeat request for the same accepted package and version is a no-op. Future ordinary upgrades follow that destination package.

## Release verification

When validating this guidance for a release, exercise all three transitions against the selected artifacts. Include Community → Pro with manually enabled commercial plugins and existing business data, Community → Enterprise with an optional plugin already preinstalled, and Pro → Enterprise with a customized source file and an active database driver. Exercise a failed acceptance and retry, a target with an older Default, and Pro and Enterprise artifacts carrying the same edition release number. Only advance the markers in successful cases.
