# RunJS TypeScript baseline (2026-07-14)

This report freezes the RunJS TypeScript behavior before official third-party declaration packs are introduced. The reusable workspace and behavior matrix live in `runjs-typescript-baseline.ts`; they are data fixtures rather than assertions so later phases can compare the same inputs without turning known baseline defects into permanent expectations.

## Installed versions

| Dependency | Installed version |
| --- | --- |
| TypeScript | 5.1.3 |
| React runtime | 18.2.0 |
| `@types/react` | 18.3.18 |
| ReactDOM runtime | 18.2.0 |
| `@types/react-dom` | 18.3.5 |
| Ant Design | 5.24.2 |
| Ant Design Icons | 5.6.1 |
| dayjs | 1.11.13 |
| lodash runtime resolved in this workspace | 4.18.1 |
| `@types/lodash` | 4.17.24 |
| mathjs | 15.1.0 |
| Formula.js | 4.4.9 |

The versions were read from the installed package `package.json` files with `require.resolve()` from the repository root.

## Current declaration coverage

`packages/core/runjs/src/typescript-project.ts` currently embeds the following third-party declarations in `runJSEnvDeclaration`:

- React: hand-written `ReactNode`, `CSSProperties`, `Attributes`, `HTMLAttributes`, `FC`, `createElement`, and `Fragment`; JSX accepts every intrinsic element with `Record<string, unknown>`.
- ReactDOM: hand-written `createRoot()`, `render()`, and `unmount()` shapes whose container and render value are `unknown`.
- Ant Design: a short hand-written list of common components typed as `React.FC<Record<string, unknown>>`, a broad component-name index signature, a narrow `Typography` object, and a narrow `message` API.
- dayjs: only a callable value with `format()`, `toISOString()`, and `valueOf()`.
- lodash, mathjs, Formula.js, and Ant Design Icons: no built-in static API declaration; access through `ctx.libs` remains `unknown` unless user declarations or casts narrow it.

The current environment already derives ECMAScript and DOM structure from the installed TypeScript standard libraries. DOM declarations are moved under `RunJSDOM`, while a separate explicit declaration exposes only approved bare runtime globals.

## Known React Hooks defect

Input:

```tsx
const [count, setCount] = ctx.React.useState(0);
ctx.React.useEffect(() => setCount((value) => value + 1), []);
```

Both browser authoring and Node source inspection use the same hand-written RunJS context declaration and currently report:

- TS2339: `Property 'useState' does not exist on type 'typeof React'.`
- TS2339: `Property 'useEffect' does not exist on type 'typeof React'.`

The Node result is exposed as `RUNJS_COMPILE_FAILED` diagnostics with `ruleId: runjs-typescript` and `details.tsCode: 2339`. The browser CodeMirror adapter currently keeps the TypeScript message and severity but does not expose the numeric TypeScript code.

## Browser and Node diagnostic paths

Browser editor:

1. `packages/core/client-v2/src/flow/components/code-editor/typescriptProject.ts`
2. dynamically imports `typescript` and builds the shared compiler options/context from `@nocobase/runjs/client-v2`
3. creates a Language Service over workspace, environment, context, and user declaration files
4. calls syntactic, semantic, and suggestion diagnostics for the active file
5. maps them to CodeMirror diagnostics

Node compiler inspection:

1. `packages/core/runjs/src/compiler/source-inspection.ts`
2. synchronously reads the installed TypeScript standard libraries
3. builds the same RunJS compiler options, environment files, and context declaration
4. creates a TypeScript Program for the complete workspace
5. maps syntactic and semantic diagnostics to RunJS compiler diagnostics

The important baseline differences are:

- the browser keeps a Language Service cache and supports completion/hover; Node creates a Program for each inspection call;
- the browser returns CodeMirror ranges and severity, while Node preserves `details.tsCode` and RunJS rule IDs;
- the browser currently places every virtual declaration in `getScriptFileNames()`, while Node passes every virtual file as a root name;
- neither path currently analyzes source usage or loads official third-party declaration packs on demand.

## Behavior matrix and runtime boundary

`runJSTypeScriptBaselineCases` covers ordinary RunJS, React Hooks, JSX, ReactDOM, dayjs, lodash, Ant Design, Icons, direct property access, bracket access, optional chaining, destructuring, aliases, dynamic access, and multi-file imports.

The frozen DOM boundary is:

- allowed as bare values: the names in `RUNJS_TYPESCRIPT_BROWSER_GLOBALS_DECLARATION`, including `window`, `document`, `fetch`, `Blob`, and `URL`;
- available through `window`: the complete `RunJSDOM` namespace, including `window.File`;
- intentionally unavailable as a bare value: `File` and any DOM constructor/function not explicitly declared;
- type availability and value availability are intentionally separate: later DOM type-only work must not create new runtime globals.

The representative invariant is that `new File(...)` reports TS2304 while `new window.File(...)` is accepted.

## Repeatable performance baseline

Command:

```bash
yarn test packages/core/client-v2/src/flow/components/code-editor/__tests__/runjsTypeScriptBaseline.bench.ts --run --reporter=verbose
```

Observed on 2026-07-14 on the local Apple Silicon development machine, Node 22.22.0, cold Vitest process:

| Metric | Result |
| --- | ---: |
| TypeScript/editor module initial load | 348.64 ms |
| First diagnostics | 1540.62 ms |
| First completion | 6.09 ms |
| Hot diagnostics | 0.95 ms |
| Language Service creations | 1 |
| React completion entries at `ctx.React.` | 2 |

These timings are trend data, not CI thresholds. The benchmark intentionally prints results and never fails on wall-clock variance.

Isolated editor TypeScript support bundle command:

```bash
node packages/core/client-v2/src/flow/components/code-editor/__tests__/measure-runjs-typescript-chunk.mjs
```

The measurement bundles the current editor TypeScript integration and raw RunJS standard-library sources, minifies it, and keeps the TypeScript runtime external to match its dynamic import. Result:

| Metric | Result |
| --- | ---: |
| Raw bytes | 1,758,610 |
| gzip bytes | 232,385 |
| Brotli bytes | 165,198 |

This is a stable isolated comparison target, not an assertion about a named production Rsbuild chunk. Later phases must additionally scan the real application build to prove third-party declaration text is absent from initial chunks.

## Installed declaration closure sizes

The following numbers were measured by resolving each entry with TypeScript `NodeJs` module resolution, creating a temporary `noLib: true`, `types: []` Program that type-imports the entry, and summing declaration source files. TypeScript standard libraries were measured from `RUNJS_TYPESCRIPT_LIB_FILE_NAMES`.

| Entry | Declaration files | Raw bytes |
| --- | ---: | ---: |
| TypeScript standard libraries used by RunJS | 44 | 1,732,947 |
| `react` | 4 | 1,108,089 |
| `react-dom/client` | 5 | 1,110,232 |
| `antd` | 584 | 1,884,763 |
| `@ant-design/icons` | 843 | 2,299,650 |
| `dayjs` | 3 | 14,635 |
| `lodash` | 13 | 464,116 |
| `mathjs` | 3 | 262,786 |
| `@formulajs/formulajs` | 1 | 210,865 |

The closure command must keep `noLib: true` and `types: []`; otherwise TypeScript includes unrelated ambient `@types/*` packages and produces misleading counts.

## Verification commands

```bash
yarn test packages/core/client-v2/src/flow/components/code-editor/__tests__/typescriptProject.test.ts --run --reporter=verbose
yarn test packages/core/runjs/src/__tests__/compiler-golden.test.ts --run --reporter=verbose
yarn test packages/core/client-v2/src/flow/components/code-editor/__tests__/runjsTypeScriptBaseline.bench.ts --run --reporter=verbose
node packages/core/client-v2/src/flow/components/code-editor/__tests__/measure-runjs-typescript-chunk.mjs
```

Runtime caches and build output are not part of the fixture and must not be committed.
