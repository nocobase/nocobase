# NocoBase Client Routing

How the two client runtimes (legacy and modern) are mounted under the app's URL space, and the terms used to describe their path prefixes. Seeded while making the modern client's URL prefix runtime-configurable.

## Language

**Legacy client**:
The v1 client runtime (`@nocobase/client`, `SchemaComponent`), served at the app root.
_Avoid_: v1 (in user-facing terms), old client

**Modern client**:
The v2 client runtime (`@nocobase/client-v2`, FlowEngine / FlowModel), served under a dedicated URL prefix.
_Avoid_: v2 (in user-facing terms), new client

**App public path**:
The base URL path the whole NocoBase app is mounted under, set by `APP_PUBLIC_PATH` (default `/`).
_Avoid_: base path, root path

**Modern client prefix**:
The single URL path segment, directly under the app public path, where the modern client is served — set by `APP_MODERN_CLIENT_PREFIX` (default `v`, historically the hardcoded `v2`). A segment, not a full path; accepted in any of `v` / `/v` / `/v/` and normalized to a bare segment.
_Avoid_: v2 prefix, route prefix, base url

**Modern client public path**:
The full URL prefix the modern client actually runs under = app public path + modern client prefix (e.g. `/nocobase/` + `v` → `/nocobase/v/`). Used as the React Router basename (minus trailing slash) and injected to the browser as `window.__nocobase_public_path__`.
_Avoid_: v2 public path

**Modern client build directory**:
The fixed on-disk location of the modern client's built assets (`dist/client/v/`), named from `DEFAULT_MODERN_CLIENT_PREFIX`. Internal and never user-facing; intentionally does NOT track the runtime **Modern client prefix**, so the prefix can change at runtime without a rebuild.
_Avoid_: v2 dist, asset directory (without "build")

## Relationships

- The **Modern client public path** = **App public path** + **Modern client prefix** + `/`
- The **Legacy client** is served at the **App public path**; the **Modern client** is served at the **Modern client public path** nested inside it
- **App public path** and **Modern client prefix** vary independently; both default such that the modern client lands at `/v/`

## Example dialogue

> **Dev:** "If I deploy under `APP_PUBLIC_PATH=/nocobase/` and set `APP_MODERN_CLIENT_PREFIX=admin`, where does the modern client live?"
> **Maintainer:** "At `/nocobase/admin/`. The prefix is a single segment composed under the app public path — it does not replace it."
> **Dev:** "And the static build output folder?"
> **Maintainer:** "That is a separate concept from the URL prefix — the folder name stays fixed regardless of what the prefix is set to."

## Flagged ambiguities

- **"v2"** was overloaded to mean three different things: (a) the **Modern client** runtime, (b) its URL **Modern client prefix**, and (c) the physical build-output directory name. Resolved: the runtime is the *modern client*; the URL segment is the *modern client prefix* (runtime-configurable, default `v`); the *modern client build directory* is a fixed internal constant (`v`), decoupled from the prefix so the prefix can change at runtime without rebuilding (see ADR-0001).
