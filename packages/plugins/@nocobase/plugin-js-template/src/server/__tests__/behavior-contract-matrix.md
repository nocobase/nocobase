# JS Template behavior contract matrix

This matrix records the authoritative behavior and security suites. Tests should depend on observable behavior rather than class names, re-export identity, locale snapshots, or full ordered collection definitions.

| Contract | Authoritative evidence |
| --- | --- |
| Save-as and Detach | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/save-as-js-template.integration.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/detach-js-template-to-inline.integration.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/client-v2/__tests__/runjs-editor-provider.test.tsx` |
| Atomic rollback | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/save-as-js-template.integration.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/detach-js-template-to-inline.integration.test.ts` |
| Head CAS | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/save-as-js-template.integration.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/detach-js-template-to-inline.integration.test.ts` |
| Idempotency and request-hash conflicts | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/save-as-js-template.integration.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/detach-js-template-to-inline.integration.test.ts` |
| Usage and delete protection | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/usage-service.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/delete-js-template.test.ts` |
| ACL and raw-resource bypass | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/permissions.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/raw-resource-bypass.test.ts` |
| Git and ZIP security | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/git-sync-security.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/source-archive-parser.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/workspace-validation-security.test.ts` |
| Runtime and disabled plugin | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/runtime-resolve.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/client-v2/__tests__/js-template-runjs-flow-surfaces-integration.test.ts`, `packages/presets/nocobase/src/server/__tests__/jsTemplatePreset.runtime.test.ts` |
| Settings typing | `packages/core/js-template-sdk/src/__tests__/settings-typegen.test.ts`, `packages/core/js-template-sdk/src/__tests__/settings-typegen-multi-template.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/compile-workspace-preview.integration.test.ts` |
| ImportTypeNode dependency closure | `packages/core/runjs/src/__tests__/static-module-references.test.ts`, `packages/core/runjs/src/__tests__/compiler-paths.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/detach-import-type.integration.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/workspace-validation-security.test.ts` |
| Five JS Template kinds | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/default-template.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/usage-service.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/save-as-js-template.integration.test.ts` |
| Package release boundary | `packages/core/build/src/__tests__/js-template-release-boundary.test.ts` |
| Final build and tar import, require, and type resolution | Task 08 final verification gate; this is command evidence, not coverage provided by the release-boundary test |
| Legacy client | `packages/plugins/@nocobase/plugin-js-template/src/client/__tests__/legacy-client-boundary.test.ts`, `packages/plugins/@nocobase/plugin-js-template/src/client/__tests__/legacy-js-template-runtime.integration.test.tsx` |
| Plugin bootstrap and reload | `packages/plugins/@nocobase/plugin-js-template/src/server/__tests__/plugin-bootstrap.test.ts` |
