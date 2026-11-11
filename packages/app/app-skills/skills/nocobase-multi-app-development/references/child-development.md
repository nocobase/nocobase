# Develop and connect a child

## Prepare an independent App

Use the child's installed `nocobase-app-development` Skill and its own guidelines. Keep a complete manifest, source, migrations, tests, configuration and build. A separate child does not need to copy the demonstration business.

For a new product choose its own package identity; across versions of an existing template preserve that identity and migration ownership. Renaming a source package is not permission to replay historical tasks. Keep shared runtime/context dependencies compatible and follow the installed package dependency rules.

The three multi-app/identity plugins are commercial. Integrate only compatible authorized packages through public client/server/CLI exports and installed Skills. Keep business code application-owned; do not import another App's private source or database tables.

## Develop with local login

Configure isolated databases/storage and distinct server/Vite ports. In a generated workspace run these in separate terminals, after checking the ports are free:

```bash
APP_SERVER_PORT=13230 pnpm dev
APP_SERVER_PORT=13232 APP_VITE_DEV_PORT=5174 pnpm --dir=apps/sub dev
```

These ports are examples, not reserved addresses. Use each printed `Local:` URL and actual base path; Vite's internal port is not the normal application entry. For a separate repository run its own development command. Main's source dev server does not hot-reload a deployed child.

Use native local login with no issuer configured. Preserve explicit local recovery access when SSO is enabled. Test ordinary-user business operations, localized page names, required management settings and authenticated/authorized APIs before connecting identity. HTTP local login does not prove platform SSO.

## Integrate identity deliberately

Read `nocobase-app-plugin-platform-sso` in the child and `nocobase-app-plugin-identity-provider` in Main. Register their public configuration factories and native-auth merge points; environment variables alone do not register a plugin. Implement role application against the child's business grants rather than copying laboratory-specific policy.

Enroll the exact approved HTTPS callback and explicit users through supported management surfaces. Do not auto-link accounts by email. Preserve `PLATFORM_SSO_IDENTITY_NAMESPACE` for existing same-platform bindings where configured; it is not a transport or TLS bypass. Issuer changes still require reviewed binding compatibility.

Declare local routes independently of deployment prefixes. Use runtime page/API/asset URL helpers and test a non-root mount, deep-link refresh, logout without automatic-login loops and child-local sessions.

## Choose delivery and prove behavior

For managed hosting, build the child's own immutable archive for the actual Host OS/CPU/libc/Node, select the intended template/environment, publish the verified version and explicitly provision or upgrade an instance. Keep instance-specific configuration and secrets outside the archive.

For external hosting, deploy independently, then register its exact public application entry including base path. Main does not deploy, stop or back up that external service. Resolve its SSO settings through authorized management and ensure the switcher uses the child's backend rather than platform cookies across origins.

Acceptance requires allowed business operations, anonymous/unassigned direct-API denial, explicit membership, revocation and role downgrade without removing unrelated grants. For managed delivery, compare two instances and verify isolation after restart. Run scoped source tests and independently record actual artifact/browser checks; static review alone does not satisfy these checks.
