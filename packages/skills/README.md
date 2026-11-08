# Public plugin Skill packages

Each `app-skill-<name>/` publishes `@nocobase/app-skill-<name>`, an independently installable public guide for `@nocobase/app-plugin-<name>`. Package type prefixes are singular; the package contains a plural `skills/` directory. The shared `@nocobase/app-skills` continues to own general application development guidance.

## Package contract

Publish `skills/nocobase-app-plugin-<name>/SKILL.md` and every referenced local document. Keep links inside that Skill so copying it into an App preserves them. The npm package exports its manifest, declares public publishing and has no runtime dependencies or peers on the commercial plugin. A Skill can therefore be read before purchasing, installing or registering the runtime.

The `nocobase.skill` manifest object records `plugin`, `pluginVersion` and `sourceRevision` for the implementation inspected while maintaining the guide. These are provenance fields, not an automatic dependency installer or an enforced compatibility range. Skill package versions follow this repository's release process independently; no matching commercial package version is promised to be published. Check the customer's available runtime versions and peer requirements before installation.

## Installation and synchronization

Once a package is published, add it as a direct App development dependency and run `pnpm nocobase skills sync`. During development, install its locally packed tarball instead. A compatible App CLI accepts the matching plugin Skill namespace; on older CLIs, read the installed `skills/` files directly. This package has no runtime entry and must not be passed to `nocobase plugin register`. Register the actual runtime plugin separately after resolving commercial access and compatibility.

A full sync prefers an installed runtime plugin's entire Skill set when it still ships one. Otherwise the standalone package supplies the guidance. Targeted runtime registration may replace a standalone owner; a targeted standalone sync never overwrites a runtime owner. Run a full sync after removal to reconcile ownership. This preserves existing installations while runtime packages migrate away from bundled Skills. It does not download Skill packages automatically.

## Maintenance

This directory is the maintained public source. Update the guide when its plugin's public integration contract changes, including installation prerequisites, exports, configuration, authorization and observable verification. Preserve the Skill name across extraction so Agent references remain stable. The initial seven packages were extracted from Pro revision `c12cc82e7a50a568a2c416c7470cbac9dcb2c350`; no commercial implementation, database migration or credential is included. The Pro repository's existing Skill copies have not been removed by this OSS change; retiring those copies is a separate coordinated migration.

Run scoped formatting checks, `node --test tests/scripts/app-skill-packages.test.mjs`, App CLI Skill synchronization tests and the scoped tarball check before delivery.
