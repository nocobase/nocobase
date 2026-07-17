# Browser provisional preview compiler

This directory contains the opt-in browser compiler for the light-extension editor. Its output is always marked
`provisional` and `client-advisory`; it is never sent to or persisted by the canonical server compile path.

## Capability spike

- Locked implementation: `esbuild-wasm` 0.27.7 through the repository lockfile.
- Supported browser API: `initialize`, `build`, virtual module plugins, external source maps, warnings, and metafiles.
- Deliberately unsupported: browser `context/rebuild`, canonical authoring inspection, database/artifact persistence,
  reference refresh, server permission checks, and server `compileKey` decisions.
- The Worker keeps one initialized WASM instance and a persistent in-memory VFS. Each preview invokes one `build`.
- The portable RunJS boundary owns POSIX virtual paths, relative import resolution, built-in module mapping, compile
  contracts, and diagnostics shared with the native compiler. It has no Node or native-esbuild imports.

## Assets and deployment

The default Worker URL uses `new URL('./browserPreview.worker.ts', import.meta.url)`. The WASM URL uses the bundler's
`?url` asset manifest, which emits a content-hashed same-origin asset and respects the configured asset/public path.
Deployments can supply manifest-resolved URLs without changing code:

- `globalThis.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__`
- `globalThis.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__`

The feature remains disabled unless `globalThis.__NOCOBASE_LIGHT_EXTENSION_BROWSER_PREVIEW__ === true`. When disabled,
the editor does not create the Worker or fetch/instantiate WASM.

Production CSP should allow the emitted same-origin Worker and WASM asset through precise `worker-src`, `script-src`,
and `connect-src` rules. The implementation does not require global `unsafe-eval`. Provisional execution uses a hidden
opaque-origin iframe with `sandbox="allow-scripts"` and its own restrictive CSP. The iframe cannot connect to the
network or access the editor window; bundle object URLs are revoked after use and on disposal.

Stable degradation codes cover Worker unavailability/crash, protocol mismatch, WASM fetch/404/CORS/CSP failures,
wrong MIME, WASM compile/initialize failure, workspace version errors, build failure, and cancellation. Any such error
only disables local preview; Save continues through the unchanged canonical server workflow.

The local contract suite exercises root-path and sub-path URL overrides, the default bundler-resolved Worker/WASM
URLs, HTTP 404, network/CORS/CSP-style fetch rejection, accepted and rejected MIME types, protocol mismatch filtering,
and the sandbox CSP/opaque-origin/object-URL cleanup rules. These tests verify deterministic application behavior;
reverse-proxy headers and browser CSP console behavior still require a deployed browser environment.

## Benchmark

`browserPreviewBenchmark.ts` provides a deterministic 20 Entry / 200 file workspace plus JSON and Markdown report
serializers. The client benchmark test records WASM download and initialization, one cold build, and 20 single-file
delta builds distributed across the 20 entries. Reports include fixture bytes and cold/warm min, p50, p95, and max.

The benchmark deliberately has no absolute timing assertion. Machine and browser measurements are rollout evidence,
not a brittle unit-test gate; the feature remains default-off if the deployed-browser warm p95 does not meet the
rollout target.

## Verification boundary

Unit tests cover the actual 0.27.7 WASM initialization/build path, source maps, metafiles, VFS delta/rename behavior,
stale response rejection, one-time Worker restart, root/sub-path URL resolution, failure-code mapping, sandbox policy,
default-off behavior, and the reproducible p50/p95 report shape. Production bundles, reverse-proxy headers,
browser-specific CSP consoles, offline/slow-network behavior, and benchmark results on the supported browser matrix
still require deployment/E2E verification before enabling the rollout flag.
