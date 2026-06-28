# RunJS Studio Acceptance Evidence

Date: 2026-06-28 UTC

## Summary

The focused automated coverage for RunJS Studio, VSC-File RunJS source
transactions, RunJS value handling, linkage, dynamic event flow plumbing, chart
surfaces, and workflow surfaces passes in this checkout.

Full browser acceptance for the requested A-G scenarios is blocked in the
current `nblocal` runtime: `/v2/admin/` and concrete `/v2/admin/<schemaUid>`
routes render the client 404 page after login, while `/admin/` loads the legacy
runtime and the existing JS block opens the legacy `Write JavaScript` editor
instead of RunJS Studio.

## Runtime Probe

- Environment: `nblocal`
- URL: `http://127.0.0.1:23000/`
- Enabled plugins checked with `nb plugin list`:
  - `@nocobase/plugin-vsc-file`
  - `@nocobase/plugin-workflow`
  - `@nocobase/plugin-workflow-javascript`
  - `@nocobase/plugin-data-visualization`
  - `@nocobase/plugin-data-visualization-echarts`

Browser screenshots:

| Path | Result |
| --- | --- |
| `/tmp/runjs-v2-admin-after-login.png` | `/v2/admin/` renders client 404 after login. |
| `/tmp/runjs-v2-flow-page-after-login.png` | `/v2/admin/0fn3jws780k` renders client 404 after login. |
| `/tmp/runjs-admin-probe.png` | `/admin/` loads the existing authenticated app. |
| `/tmp/runjs-studio-main.png` | Existing `/admin/` JS block opens the legacy editor, not RunJS Studio. |

The browser probes did not reproduce the prior `runJSManifestPath` bundle
linking error; `manifestErrors` was empty.

## Automated Verification

| Layer | Command | Result |
| --- | --- | --- |
| Studio component | `yarn test packages/plugins/@nocobase/plugin-vsc-file/src/client-v2/runjs-studio/__tests__/RunJSStudioProvider.test.tsx --run --reporter=verbose` | Pass, 39 tests |
| Compiler | `yarn test packages/plugins/@nocobase/plugin-vsc-file/src/server/runjs-sources/compiler/__tests__/compileRunJSSourceWorkspace.test.ts --run --reporter=verbose` | Pass, 18 tests |
| API and transaction rollback | `DB_DIALECT=postgres DB_HOST=localhost DB_PORT=5432 DB_DATABASE=nocobase_runjs_task12 DB_USER=nocobase DB_PASSWORD=nocobase yarn test packages/plugins/@nocobase/plugin-vsc-file/src/server/__tests__/runjs-sources.test.ts --run --reporter=verbose` | Pass, 26 tests |
| FlowModel surface wiring | `yarn test packages/core/client-v2/src/flow/models/__tests__/RunJSFlowModelSurfaces.test.ts --run --reporter=verbose` | Pass, 11 tests |
| RunJS editor registry | `yarn test packages/core/client-v2/src/flow/components/__tests__/RunJSEditorRegistry.test.tsx --run --reporter=verbose` | Pass, 7 tests |
| RunJS value utilities | `yarn test packages/core/flow-engine/src/utils/__tests__/runjsValue.test.ts --run --reporter=verbose` | Pass, 4 tests |
| RunJS context contributions | `yarn test packages/core/flow-engine/src/__tests__/runjsContributions.test.ts --run --reporter=verbose` | Pass, 3 tests |
| Form value runtime | `yarn test packages/core/client-v2/src/flow/models/blocks/form/value-runtime/__tests__/runtime.test.ts --run --reporter=verbose` | Pass, 71 tests |
| Filter form default values | `yarn test packages/core/client-v2/src/flow/models/blocks/filter-form/__tests__/defaultValues.wiring.test.ts --run --reporter=verbose` | Pass, 10 tests |
| Linkage assignment RunJS values | `yarn test packages/core/client-v2/src/flow/actions/__tests__/linkageAssignField.legacy.test.ts --run --reporter=verbose` | Pass, 16 tests |
| Linkage RunJS script template handling | `yarn test packages/core/client-v2/src/flow/actions/__tests__/linkageRules.runjsTemplateResolution.test.ts --run --reporter=verbose` | Pass, 1 test |
| Dynamic event flow plumbing | `yarn test packages/core/flow-engine/src/executor/__tests__/eventStep.test.ts --run --reporter=verbose` | Pass, 4 tests |
| JS item action render smoke | `yarn test packages/core/client-v2/src/flow/models/actions/__tests__/JSItemActionModel.test.tsx --run --reporter=verbose` | Pass, 2 tests |
| Workflow client wrapper | `yarn test packages/plugins/@nocobase/plugin-workflow-javascript/src/client/__tests__/WorkflowRunJSEditorField.test.tsx --run --reporter=verbose` | Pass, 3 tests |
| Workflow server adapter | `DB_DIALECT=postgres DB_HOST=localhost DB_PORT=5432 DB_DATABASE=nocobase_runjs_task12_workflow DB_USER=nocobase DB_PASSWORD=nocobase yarn test packages/plugins/@nocobase/plugin-workflow-javascript/src/server/__tests__/runjs-source-adapter.test.ts --run --reporter=verbose` | Pass, 5 tests |
| Chart surfaces | `yarn test packages/plugins/@nocobase/plugin-data-visualization/src/client-v2/flow/models/__tests__/ChartRunJSSurfaces.test.tsx --run --reporter=verbose` | Pass, 2 tests |

## Browser Scenarios

| Scenario | Status | Evidence |
| --- | --- | --- |
| A. JSBlock | Blocked | The current `/admin/` JS block opens the legacy editor; `/v2/admin/` routes render 404. |
| B. JS Action | Blocked | Requires a reachable RunJS Studio browser entry. Covered by FlowModel surface tests and JS item action smoke. |
| C. RunJSValue, Assign Form, Filter Form | Blocked in browser | Covered by RunJS value utility, form value runtime, and filter-form default-values tests. |
| D. Linkage and dynamic event flow | Blocked in browser | Covered by linkage tests and event flow executor tests. |
| E. Chart | Blocked in browser | Covered by chart RunJS surface tests. |
| F. Workflow JavaScript | Blocked in browser | Covered by workflow client wrapper and server adapter tests. |
| G. Conflict | Blocked in browser | Covered by RunJS Studio conflict component tests and RunJS source API conflict tests. |

## Surface Checklist

| Surface | Automated coverage |
| --- | --- |
| JSBlock | `RunJSFlowModelSurfaces.test.ts`, `RunJSStudioProvider.test.tsx`, `runjs-sources.test.ts` |
| JS action | `RunJSFlowModelSurfaces.test.ts`, `JSItemActionModel.test.tsx` |
| RunJSValue | `runjsValue.test.ts`, form value runtime tests |
| Assign Form | form value runtime tests |
| Filter Form | `RunJSFlowModelSurfaces.test.ts`, `defaultValues.wiring.test.ts`, form value runtime tests |
| Linkage | `linkageAssignField.legacy.test.ts`, `linkageRules.runjsTemplateResolution.test.ts` |
| Dynamic event flow | `eventStep.test.ts`, `RunJSFlowModelSurfaces.test.ts` event-flow action surfaces |
| Chart | `ChartRunJSSurfaces.test.tsx` |
| Workflow | `WorkflowRunJSEditorField.test.tsx`, `runjs-source-adapter.test.ts` |

## Known Limits

- Full browser acceptance is not complete in this local runtime because the
  requested v2 admin routes render 404 and the reachable `/admin/` page exposes
  the legacy editor entry.
- The API transaction tests were run with Postgres because this checkout does
  not have the sqlite driver available for the default server test path.
- Browser probes showed unrelated mobile deprecation and duplicate `openView`
  registration warnings. They did not show a `runJSManifestPath` export error.
