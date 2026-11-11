# Multi-app template packaging

This open-source package generates a complete Main application at the project root and an independent sample child under `apps/sub/`. Commercial plugins remain licensed registry dependencies; no commercial implementation is copied into this repository. Read the [generated application's guide](template/README.MD) for prerequisites, configuration, builds, explicit initialization and runtime acceptance.

## Source and published payload

The wrapper `package.json` declares tooling dependencies only, so installing the OSS workspace does not install the commercial App payload. `template/` contains the complete Main and child source; `scripts/build-template.mjs` audits and composes it into `dist/`. `publishConfig.directory` publishes that composed Main, not the wrapper. The inert `pnpm-workspace.template.yaml` becomes `pnpm-workspace.yaml` during create-app generation.

Maintain OSS dependencies with the same `workspace:^` / `workspace:*` and `catalog:` declarations as Default. The builder uses pnpm's workspace inventory to create disposable OSS package links, then runs native `pnpm pack` for Sub and Main separately against the repository's catalog. It copies back only the resolved manifests and removes all staging links; never add a manual version table, copy the catalog, or install commercial dependencies while packaging. Commercial plugin versions remain explicit compatible registry releases.

```bash
pnpm --filter @nocobase/app-template-multi-app fix
pnpm --filter @nocobase/app-template-multi-app typecheck
pnpm --filter @nocobase/app-template-multi-app test
pnpm --filter @nocobase/app-template-multi-app build
pnpm --filter @nocobase/app-template-multi-app pack --out /absolute/path/to/template.tgz
```

Validate a real packed artifact through a compatible create-app outside the source workspace. Preserve migration/seed bytes and persistent identities. Source audits and packaging tests do not establish production dependency installation, standalone execution, SSO, permissions or lifecycle acceptance. Keep licensed artifacts out of public CI uploads and caches.

## Shared guidance

The three scenario Skills belong only to `@nocobase/app-skills`; its existing application-development entry routes the corresponding tasks. Both Apps declare `workspace:*` for this package, which native pnpm packing resolves to its exact release version. Generated projects use the same package dependency, `postinstall` and Skills synchronization mechanism as Default and Examples, without a template-local source tree or a new scanner. A locally packed candidate containing these files is not proof that an older published package already includes them.
