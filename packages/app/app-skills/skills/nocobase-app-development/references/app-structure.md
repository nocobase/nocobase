# How an application is put together

Read this when you need to know where a file goes, which file composes the client or the server, how configuration reaches a module, or before changing the framework structure the template provides.

## Where things go

Business code goes in these places. This is where you work, and where you should stay unless the task genuinely requires otherwise:

```text
client/routes.ts          Declare a page route
client/pages/             The page component; a folder when a page has children or files of its own
client/components/        Your components
client/components/ui/     shadcn/ui primitives; add with the CLI, never hand-write or edit
client/hooks/             Hooks shared across features
client/locales/           Every user-visible string; system/ holds the template's copy
client/service-provider.ts Client startup: services that boot with the application
server/routes/            HTTP endpoints
server/providers/         Services and their lifecycle
database/main/migrations/      Schema changes
database/main/seeds/           Required initial data
database/main/collections/     Generated Collection artifacts; regenerate, never edit
cli/commands/             Commands this application owns
tests/                    Tests; never beside the source
```

A page with children or page-local helpers uses a folder with `index.tsx`; child folders mirror route paths. Keep page-local components and data in that folder, reserving `client/components/` for application-wide components. See [child routes](frontend/references/child-routes.md) for examples.

A feature with a page and an API touches five places: a migration for the table, a route in `server/routes/`, a page in `client/pages/` declared in `client/routes.ts`, navigation on the page route, and strings in `client/locales/`.

## How the client is composed

`client/runtime.ts` composes the browser application; `client/react-providers.ts` declares React providers in outer-to-inner layers `root`, `application`, and `extension`. Applications use the first two and plugins own the last; `before` and `after` order providers only within their layer.

## How the server is composed

`server/runtime.ts` composes configuration, plugins, providers and routes; `server/app.ts` assembles the application. `server/standalone.ts` starts the Node listener and `server/embedded.ts` lets a host mount the same runtime. Register endpoints through `server/routes/index.ts`; queue consumers and background jobs are registered from a service provider, not discovered from a directory.

`server/app.ts` calls `createAppFromRuntime(runtime)` to transfer configuration, paths, mode and Host logging policy and bind `runtime.app`. Keep Provider, middleware and route registration explicit and ordered; `startApplicationInScope` owns startup and shutdown binding.

`runtime.paths`, configuration context `paths`, and `app.paths` share one resolved `AppPaths` object. Use `paths.storage('...')`, `paths.database('...')`, or the corresponding directory fields. `AppPathOptions` is input only; application path policies run before the final object is created and configuration is loaded. Standalone entries declare the deployment root in `server/runtime.ts` so the server and CLI share persistent storage outside the compiled code directory.

## Configuration

Editable module defaults live in `server/config/` and are collected by `defaultAppConfigs` in its `index.ts`; `server/config.ts` loads the configuration file. Each section declares the environment variables that set it in `env` of its `defineAppConfig`, with a `description` and, where it applies, `secret`, `required`, `generate` or `firstStartOnly` in the helper's second argument; `pnpm nocobase config env` lists them all, `pnpm nocobase config variables` describes each, and `pnpm build` writes that description to `dist/variables.json` for whoever deploys the build. `server/config/database.ts` maps `DB_*` onto the main connection and `server/config/users.ts` maps `INITIAL_ADMIN_*` onto the initial administrator. `config.yml` is read as written: a `${NAME}` in it is not expanded. [Services and jobs](services-and-jobs.md#application-code-configuration) shows how a module declares and reads its configuration.

### Knowledge indexing

`server/config/knowledge.ts` registers the plugin's pure `defineKnowledgeConfig()` factory. Declare server-only instances under `knowledge.indexing` in `config.yml`; `config.example.yml` shows `sqlite-vec` and `pgvector`, private connection/TLS fields and the optional `knowledge.jobs` host configuration selector. Leave the selector omitted to follow the host default. Instance definitions do not enable indexing: the Knowledge global index dialog owns the instance/model selection and explicit all-space rebuild confirmation. Do not put model selection or per-space overrides in deployment YAML, reuse Agents vector collections, or insert literal `${NAME}` placeholders expecting expansion. A custom indexing extension must be passed to both `defineKnowledgeConfig` and `createKnowledgePlugin`.

### File storage

Configure storage in `server/config/drive.ts`, with serializable overrides in `config.yml`. Keep the default `DriveProvider` and resolve `driveManagerToken` from `@nocobase/app-server/drive`; File Repository uses the same manager. Read `.agents/skills/nocobase-drive/SKILL.md` for the `fs`, `s3`, and `oss` configuration guides, custom driver factories, URL behavior, and release artifact limitations. That Skill ships with `@nocobase/drive` and is synchronized from the installed package.

## The rest is framework structure

`client/routing/`, `client/layouts/`, `client/theme/`, the server entry points, the `package.json` scripts that call `nocobase`, and the tsconfigs are the scaffolding the template provides. It is still this application's own source — it shipped to the user and they may change it — but it is the part the template evolves, so an edit there is what a future upgrade has to reconcile. [Customizing the shell](frontend/references/shell.md) lists the shell behaviors to keep.

Prefer the mechanism the system already provides. Declare a page in `client/routes.ts` and add `navigation` when it needs a menu entry; pages load data through `useApiClient`. A page uses `authz` to restrict access; a plugin page is customized through an option or an override. Before editing the shell to add a menu, check the route and its `navigation` declaration.

When the built-in mechanism genuinely cannot express what is being asked, changing this structure is a legitimate answer — not a last resort to apologize for. Do it deliberately, and leave the next agent enough to work with:

- Comment what you changed and why the built-in path did not fit. On upgrade, an agent reconciling the template's version needs to know whether your change is still needed.
- Record the application-specific guidance in the same change, so it describes the application as it actually is: update the topic file under the application's `.agents/rules/`, or add one, and keep its entry in the `AGENTS.md` index. Do not grow `AGENTS.md` itself; it stays a small always-on index of at most 32 KB that every agent loads on every start.
- If the framework's shared guidance is wrong for every application, propose the change to the source `@nocobase/app-skills` package instead of editing its synchronized copy.

## Outbound email configuration

Declare `mail` with `defineMailConfig` and register `MailerProvider` from `@nocobase/app-server/mailer`. Put named SMTP/Resend sender configurations directly under `mail`; `default` is the conventional sender. `auth.passwordReset: true` and a notification channel `{ provider: email }` both use it; advanced consumers use `{ mailer: marketing }`. Password reset bypasses notification records, queues and retries. Missing or disabled references fail startup. Existing Mail account plugin settings remain in the same section: compose its `mailConfig` defaults and env mappings into `defineMailConfig({ defaults: mailConfig, env: mailConfig.rules?.env })` rather than replacing them.

The default maps `MAIL_PROVIDER/HOST/PORT/SECURE/USER/PASSWORD/FROM/API_KEY`; set the provider explicitly when using environment-only configuration. Named senders need explicit `envString` / `envInteger` / `envBoolean` mappings in `server/config/mail.ts`. Mark passwords and API keys `secret: true`, and never publish `mail` to browsers. YAML does not interpolate `${NAME}`. Legacy SMTP/Resend notification channel settings and `auth.passwordReset.enabled/emailChannel` work with a startup warning until v4.0.0: move transport fields to `mail.<name>`, replace channels with email references, replace recovery settings with `true`, `false` or `{ mailer }`, and move default secrets to `MAIL_PASSWORD` / `MAIL_API_KEY`. Restart the application after changing sender configuration.
