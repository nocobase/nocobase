# Multi-app application

This template contains two complete, independent NocoBase 3 applications. Main provides the workbench, template/version and instance management, external application entries and platform identity provider. Sub contains the reagent-management business and the platform SSO client. Main consumes Sub deployment archives; neither App imports the other's business source.

## Availability and commercial prerequisites

The template source is open source, but `@nocobase/app-plugin-multi-app`, `@nocobase/app-plugin-identity-provider` and `@nocobase/app-plugin-platform-sso` are **commercial plugins**. You need a compatible released version, a commercial license and package-download permission. This template does not contain their implementations or make them free or open source.

The template and the `multi-app` create-app alias must be released before the public command below is available. For an unreleased checkout, use its candidate CLI and packed template artifact instead; do not assume the current npm create-app supports it. The initial candidate's commercial dependency versions come from the application source baseline and must be checked against the authorized registry before runtime acceptance or release. A structure check is not proof of package availability, successful installation or SSO.

Use Node.js 24 or newer and pnpm 11.7.0. Reuse an authorized registry login, or log in securely at the terminal; never put a token in command arguments, a plan, source files or logs:

```bash
pnpm login --registry=https://pkg-v3.nocobase.com/ --scope=@nocobase
npm whoami --registry=https://pkg-v3.nocobase.com/
npm view @nocobase/app-plugin-multi-app version --@nocobase:registry=https://pkg-v3.nocobase.com/
npm view @nocobase/app-plugin-identity-provider version --@nocobase:registry=https://pkg-v3.nocobase.com/
npm view @nocobase/app-plugin-platform-sso version --@nocobase:registry=https://pkg-v3.nocobase.com/
```

After compatible CLI, template and commercial package releases are available:

```bash
pnpm create @nocobase/app platform --template=multi-app --registry=https://pkg-v3.nocobase.com/
cd platform
```

A 401, 403 or missing commercial version is an installation blocker, not a reason to substitute fake plugins or link another repository. create-app retains the generated project if installation fails. Fix licensing, package versions or registry login, then run `pnpm install` at the existing workspace root and `pnpm skills:sync`; do not recreate the project over it. No commercial credentials are written by create-app.

## Workspace and configuration

The project root is the complete Main application; `apps/sub/` is the sample child. Root `package.json`, client/server source, configuration, database, storage, tests and build belong to Main. The child owns the equivalent files in its directory. They share installation and a lockfile, not runtime state or business source. Their generated names are `<project>` and `<project>-sub`; persisted business, permission, migration, template and instance identities remain unchanged.

Install dependencies once at the root. Each App uses the standard `postinstall: nocobase skills sync`; create-app also verifies drivers and synchronizes guidance per declared App. Root `pnpm nocobase config init` and `pnpm nocobase skills sync` operate Main. For later dependency changes, run `pnpm install`; if scripts were disabled or guidance needs refreshing, run `pnpm skills:sync` to synchronize Main and Sub.

Creation writes no runtime configuration. For HTTP local-account development, configure Main with its helper, which initializes only that App's configuration and disables the managed Host:

```bash
pnpm setup:local
pnpm --dir=apps/sub nocobase config init
pnpm --dir=apps/sub nocobase config set server.port=13232 app.publicOrigin=http://127.0.0.1:13232
```

Before either first start, edit that App's `config.yml` and set a unique strong `users.initialAdmin.password` and the intended administrator username/email. Keep generated `secrets.keys` private and stable across restarts. Changing initial administrator configuration later does not reset an existing account. Do not copy the example configuration's placeholder secret manually; `config init` generates the real key.

```bash
pnpm nocobase config check
pnpm --dir=apps/sub nocobase config check
```

To choose another database for an App, add the driver **inside that App**, then initialize that App's configuration with the matching dialect and fill in the required connection settings. For example, before configuring Sub: `pnpm --dir=apps/sub add @nocobase/db-postgres`, then `pnpm --dir=apps/sub nocobase config init --dialect postgres`. This does not change Main's database. Never share their database files, storage paths or secrets accidentally.

Start development in separate terminals:

```bash
APP_SERVER_PORT=13230 pnpm dev
APP_SERVER_PORT=13232 APP_VITE_DEV_PORT=5174 pnpm dev:sub
```

Read each command's printed `Local:` URL, including the actual Hono port and application base path. Vite's internal port is not the normal application entry. HTTP supports local accounts only; it is not a complete platform SSO setup. Do not run the HTTP setup helper over an existing HTTPS configuration unless you intend to switch modes.

## Build the Apps

```bash
pnpm --dir=apps/sub build --tar
pnpm build --tar
```

Each App writes its own `dist/` and `storage/exports/dist.tar.gz`. Build for the actual target platform and Node version with the App CLI's supported options; use `pnpm --dir=apps/sub build --help` to inspect them. The archive is a deployment artifact, not a copy of the source workspace. Keep complete production dependencies and compiled migration manifests, but keep configuration, secrets, databases and instance volumes separate. Test extracted artifacts away from the source workspace before deployment.

Root `pnpm dev` and `pnpm build` operate Main, just like an ordinary application. Use `build:sub` for the child or `build:apps` to build Sub and Main sequentially; pass `--tar` directly to the intended App's build command when an archive is required. `pnpm check:structure` is a separate non-destructive source audit, not compilation or runtime acceptance. Run each App's `lint`, `typecheck`, `test` and build explicitly after changing that App. Root template tests and public CI structural checks do not replace commercial integration acceptance. Do not upload commercial packages or built deployments to public CI artifacts or caches.

Docker source builds use the generated workspace root as context, `APP_DIR=.` for Main or `APP_DIR=apps/sub` for Sub, and a BuildKit `npmrc` secret for authorized downloads. Do not copy a credential-bearing npmrc into the context. Prebuilt archives can use their own Dockerfile with `--build-arg DIST=prebuilt`, after building for the image's Linux architecture. Docker and target-platform execution require separate verification.

## Explicit initialization and HTTPS SSO

Full multi-app operation needs an existing, operator-authorized **trusted HTTPS origin**, for example `https://platform.example.com`. Its ingress must forward all paths and WebSocket upgrades to Main on `127.0.0.1:13230`, preserve the public host and HTTPS forwarding headers, and leave managed Host port `13231` private. Setup creates no proxy, DNS record, certificate or tunnel. Check that the selected ports are free; use isolated data and ports for acceptance.

```bash
EXAMPLE_MODE=sso EXAMPLE_PUBLIC_ORIGIN=https://platform.example.com pnpm setup:local
pnpm nocobase config check
pnpm build --tar
```

This enables the managed Host and Secure cookies. It does not create instances. Keep Main's configured administrator and generated secrets stable. Create a local, ignored `demo-plan.json` at the workspace root, using the actual Sub version from `apps/sub/package.json`:

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
      "name": "Reagent management demo",
      "version": "<actual-Sub-version>"
    }
  ]
}
```

The version above is an example, not a requirement for two fixed releases. Both version fields must match the actual immutable Sub archive. Paths resolve relative to the plan file, not the invoking directory. A single valid version is enough for initialization; prepare a second real archive only when testing upgrades. Never relabel an archive or overwrite a published version with different content.

```bash
pnpm demo --initialize --plan "$PWD/demo-plan.json"
```

Only this explicit initialization uploads/publishes artifacts, provisions missing instances and grants the configured unrestricted administrator access to newly created instances. It validates the complete plan before mutation and rejects archive/version mismatch before publication. Rerunning it retains existing instances and their selected versions instead of resetting or upgrading them. Ordinary install, dev, start and demo never initialize instances.

After initialization completes, open the configured HTTPS origin with Main's `/main/` entry path, sign in and open the child from the workbench. Verify actual browser SSO, a business read/write, denial of unauthorized UI and direct API access, explicit stop refusing to wake on requests, explicit restart preserving data, idle wake, and retained state across Main/Host restarts. This is the real acceptance boundary; a source assertion, successful build or reachable HTTP page is not equivalent.

For subsequent starts, keep the same configuration and data:

```bash
pnpm demo
```

App Host explicit-stop unregister semantics were merged in PR #11418 (`2d18eb2c48`). Main checks the Host resolved from its built dependency tree before explicit initialization; it applies no old-version patch. Rebuild with compatible packages when that guard fails, then verify lifecycle behavior in the final artifact. Respect capacity-admission failures rather than disabling safety checks. Preserve `PLATFORM_SSO_IDENTITY_NAMESPACE` for existing same-platform account bindings; it is not an HTTP transport bypass. Remote HTTP OIDC patches and disabled TLS verification are not supported.

## Scenario Skills

Read the task routing in [application development](.agents/skills/nocobase-app-development/SKILL.md). The three multi-app scenario Skills ship in `@nocobase/app-skills` and synchronize into each App's `.agents/skills/` as real copies, with relative `.claude/skills/` links. They are available from Main and from Sub opened independently. Ordinary business features still use application development; template/framework upgrades use application upgrade, not managed-instance release operations. Installing guidance does not enable commercial capabilities or turn another App into Main.

## Plugin guidance

Read the synchronized plugin Skills inside the App you are changing, especially `nocobase-app-plugin-multi-app`, `nocobase-app-plugin-identity-provider` and `nocobase-app-plugin-platform-sso`. Each plugin owns its guidance. Missing guidance means checking the installed package, authorization and compatibility, not guessing private API signatures. `.agents/skills/` and `.claude/skills/` are generated; do not edit them or copy plugin implementation into this template.
