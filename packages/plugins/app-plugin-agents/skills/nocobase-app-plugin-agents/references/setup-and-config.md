# Setup and configuration

## Register the plugin

The plugin has three entries, each listed in the App's matching composition root:

| Root                | Import                                                    | Entry                                               |
| ------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| `server/plugins.ts` | `import agents from '@nocobase/app-plugin-agents/server'` | `agents`                                            |
| `client/plugins.ts` | `import agents from '@nocobase/app-plugin-agents/client'` | `agents()`                                          |
| `cli/plugins.ts`    | `import agents from '@nocobase/app-plugin-agents/cli'`    | `agents` (adds `pnpm nocobase agents runner-token`) |

Register `@nocobase/app-plugin-authentication`, `@nocobase/app-plugin-authorization` and `@nocobase/app-plugin-file` before it; they are its peers, and chat attachments and the skill library store files through the file plugin and Drive. Run `pnpm nocobase db apply` after adding it: the plugin brings its own migrations. Run `pnpm nocobase skills sync` so this Skill reaches the App's `.agents/skills/`.

The App binds `agentsAccessToken` (`AgentsAccess.scopeOf(identity, key)`) from one of its own providers to say how far each caller's business actions reach (`BUSINESS_ACTIONS` in `@nocobase/app-plugin-agents/shared/access`). Unbound, every level is `none`, and only who manages agents (the `agents.agents` settings item) changes agents and skills. The README's "HTTP API" section lists the four settings items (`agents.agents`, `agents.runners`, `agents.prices`, `agents.services`) and what each allows.

Contributions (subjects, scopes, actions and the rest) go in a provider of the App that resolves `agentsToken` at boot; see [Extension points](extension-points.md). Keep them together, for example in `server/agents/`, and the browser's side in `client/agents/`.

## The App's own CLI

Agents call the App through the App's CLI. An App that wants one declares it under `nocobase.cli` in its `package.json` (`bin`, `displayName`, `envPrefix`, `auth.clientId`, `skills`, …) and adds `@nocobase/app-cli-client` to its `devDependencies`, plus `@nocobase/agent-runner` to pack the runner. `@nocobase/app-cli`'s README, section "The application's own CLI: `cli build` and `cli link`", lists every field. `pnpm nocobase cli link` makes `pnpm exec acme` run it during development. Its commands are the App's API routes that declare `x-cli` (`cliRoute()` in `describeRoute()`), served by `GET /api/cli/manifest`; a route a run may call lists `runToken` in its `security` and gives its `x-cli` an `action`. The README's "The CLI's commands" section has the details.

## Configuration

Everything is optional. Read the README's "Configuration" section for the annotated block; in short:

```yaml
agents:
  cli: # the CLI runs get
    name: acme
    credentialFile: .acme/run.json # .<name>/run.json by default
    package: { kind: served } # or { kind: npm, package, version }, or { kind: preinstalled }
  app: { id: acme, name: Acme } # how runners name this App
  dist: # the runner and CLI tarballs
    dir: storage/runners/dist # the default; relative to the App root
    channel: stable
    versions: { acme: 0.1.0 } # pin a product instead of the channel's highest
  server: # online agents, run by every instance
    enabled: true
    maxSteps: 16
    consult: { timeoutMs: 120000, tokenBudget: 200000 }
  vectors:
    store: sqlite-vec # the default; pgvector (own PostgreSQL), or false
    path: storage/vectors.sqlite
  skills:
    disk: s3 # Drive disk for skill files; drive.default by default
```

- `agents.cli.name` defaults to `agents.app.id`; set it to the App's `nocobase.cli.bin` so runs install and call the same CLI the App serves.
- `agents.server.enabled: false` leaves online runs to the other instances.
- `sqlite-vec` is local to an instance and has no build for Alpine (musl), where it reports `SQLITE_VEC_UNSUPPORTED`; an App running several instances, or on Alpine, uses `pgvector`, which takes its own PostgreSQL connection and never the App's.
- Moving `agents.skills.disk` does not copy what is stored: copy `skills/blobs/` across first.
- Model services are not configured here; they are added on the Models page or through the API.
- `secrets.keys` (the App's secrets service) must be set before variables or model service keys can be stored. `pnpm nocobase secrets rotate` reseals both stores.

## Pages and chat

The plugin has no routes of its own. The App routes what `@nocobase/app-plugin-agents/client/routes` exports (`agentsRoute`, `runtimesRoute`, `skillsRoute`, `usageRoute`, `modelsRoute`), each behind a page grant named like its route (`PAGES` in `shared/access`); `modelsRoute` stands behind `agents.services` read. `client/kit` has the pieces for the App's own settings pages (`VariablesSection`, `DefaultSkillsSection`, `useRunnerOptions`, `useAgentOptions`), `client/runs` the headless parts of a subject's runs, `client/profile` the person's default chat agent, and `client/config` the business-action catalog context.

The chat is headless in `client/chat`: wrap the App's routes in `ChatProvider` and install the UI Library's `agent-chat` block (`yes n | pnpm exec shadcn add @nocobase/agent-chat`) for its UI. The README's "Web UI" section describes every export.
