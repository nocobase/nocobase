# Configure, initialize and resume a workspace

## Preflight and ownership

Read the project README, root and target App `AGENTS.md`, the actual scripts and installed CLI/deployment guidance. Use the declared Node/pnpm versions. Inspect listeners, owned processes, current configuration, archives and desired instance states without printing credentials.

For a shared workspace install dependencies once at the root, not independently in every App. In the current template the root is Main: its configuration, Skills and runtime commands run there; child commands run in `apps/sub`. Other projects keep their actual declared App roots. Existing healthy configuration/artifacts should be reused, not regenerated merely to restart. Never start two processes on the same database/storage.

## Local accounts versus SSO

For a newly generated multi-app template, follow its README for HTTP local-account configuration. The following helper belongs to that template, not to every application receiving these Skills:

```bash
pnpm setup:local
pnpm --dir=apps/sub nocobase config init
pnpm --dir=apps/sub nocobase config set server.port=13232 app.publicOrigin=http://127.0.0.1:13232
```

Before first startup set a unique administrator password and identity in each App's private configuration; keep generated keys stable. Changing initial-admin settings later does not reset an existing account. Review effective settings with each App's `nocobase config check` without dumping private values.

For development choose distinct available entry/Vite ports explicitly and read the printed `Local:` URLs; see development guidance. HTTP local login does not establish SSO.

For platform SSO obtain an existing operator-authorized trusted HTTPS origin before configuration:

```bash
EXAMPLE_MODE=sso EXAMPLE_PUBLIC_ORIGIN=https://platform.example.com pnpm setup:local
pnpm nocobase config check
```

The origin above is a placeholder to replace, not permission to create DNS/tunnels or repurpose another service. The helper configures Main's origin, loopback server, Secure cookies and managed Host; it does not initialize instances or migrate persisted environment URLs/callbacks. Inspect configured listeners and keep Host control/listeners private as required by the actual backend. Never weaken TLS or use HTTP OIDC patches.

## Build and explicitly initialize

Build Sub and Main independently with the compatible CLI:

```bash
pnpm --dir=apps/sub build --tar
pnpm build --tar
```

Require both commands to succeed, including independent dist production dependency installation. Development workspace overrides/caches or source compilation do not prove the deployment is complete. Archives are written under each App's own `storage/exports/`; verify target compatibility and extracted execution before claiming usable artifacts.

Create an explicitly approved local `demo-plan.json` at the workspace root. Replace both version placeholders with the actual version embedded in the immutable Sub archive:

```json
{
  "artifacts": [
    {
      "version": "<actual-Sub-version>",
      "path": "./apps/sub/storage/exports/dist.tar.gz"
    }
  ],
  "instances": [
    {
      "id": "reagents-demo",
      "name": "Reagent demo",
      "version": "<actual-Sub-version>"
    }
  ]
}
```

One valid archive/version is sufficient. Artifact paths resolve relative to the plan, not the invoking directory. A second version is needed only for upgrade testing and must be a genuinely different immutable release, never a relabeled archive.

```bash
pnpm demo --initialize --plan "$PWD/demo-plan.json"
```

Only this explicit operation validates the plan, publishes missing artifacts, provisions absent instances and grants the configured unrestricted administrator access to newly created demo instances. Read back actual versions/memberships; an existing interrupted instance may require supported recovery. The initializer retains existing selections/settings and is not a general production bootstrap.

## Resume without initialization

If approved built Main/configuration already exist, `pnpm demo` starts them without initialization. Ordinary install, dev, start and demo must not create, reset or upgrade instances. Use the extracted deployment's own declared startup procedure for production; the source-workspace demo wrapper is not an extracted-archive command.

Check the actual public Main entry and intended child path, browser SSO, business operations, denied access and persistence. Report process owner/log, exact checked entry and pending evidence. Keep deliberately stopped instances stopped.
