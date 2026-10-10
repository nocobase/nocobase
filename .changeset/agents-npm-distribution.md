---
'@nocobase/agent-protocol': minor
'@nocobase/app-plugin-agents': minor
'@nocobase/studio': minor
---

An application can name the runner and its CLI on npm when it has no tarball of them. `agents.dist.npm` maps a product to its npm package and an exact version, such as `{ nocobase-runner: { package: '@nocobase/agent-runner', version: '1.0.0' } }`; a product `agents.dist.dir` has a current version of is still served from there exactly as before. Only callers that say they understand the answer receive it: the resolve route (`/api/agents/dist/products/<product>/targets/<target>`) answers `{ kind: 'npm', product, version, package, channel }` (or `kind=npm` lines with `format=env`) to a request with `accept=npm`, and a heartbeat answer carries `npmUpgrade` instead of `upgrade` only to a runner that declares the new `npm` feature. Every other caller gets what it got before: the artifact when there is a tarball, otherwise a 404 and no update.

`@nocobase/agent-protocol` adds `DistNpmPackage`, `DistResolution`, `DIST_ACCEPT_NPM`, `NpmUpgradeNotice`, `HeartbeatResponse.npmUpgrade` and the `npm` runner feature (`NPM_UPGRADE_FEATURE`), and moves `PROTOCOL_VERSION` to 8 so that a runner announcing `npm` is refused cleanly by a server that does not know it. Nothing of protocol 7 changed: a server speaking 8 still serves runners speaking 3 to 7. A runner speaking 8 is shown as needing an upgrade by an application that serves only up to 7, so upgrade the application before its runners.

NocoBase Studio pins the runner it serves to the exact `@nocobase/agent-runner` version it was built with, recorded by `pnpm build` in `dist/server/agents/served-versions.json` (the runner stays out of the deployment's dependencies), and names it on npm when its image carries no runner tarballs. Redeploying Studio moves runners that understand npm updates to that version.
