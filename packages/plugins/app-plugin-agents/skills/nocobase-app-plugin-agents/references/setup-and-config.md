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
    npm: # a product with no tarball in dir, named on npm instead (exact versions)
      nocobase-runner: { package: '@nocobase/agent-runner', version: 1.0.0 }
  skills:
    disk: s3 # Drive disk for skill files; drive.default by default
```

- `agents.cli.name` defaults to `agents.app.id`; set it to the App's `nocobase.cli.bin` so runs install and call the same CLI the App serves.
- Moving `agents.skills.disk` does not copy what is stored: copy `skills/blobs/` across first.
- Model services, for the App's own model calls, are not configured here; they are added on the Models page or through the API.
- `secrets.keys` (the App's secrets service) must be set before variables or model service keys can be stored. `pnpm nocobase secrets rotate` reseals both stores.

## Pages and chat

Registering the plugin brings its whole UI with no page code in the App: the header ✦ button (header action `agent`), the panel beside the content (the App's layout must render `AppLayoutProviders` and `AppAsideOutlet` from `@nocobase/app-client`, as both templates do), the conversation page `/chat/:conversationId` (route `agentChat`), System settings › AI (Agent, Model services, Runtimes, Skills, Usage, each behind reading the settings item its API checks: `agents.agents`, `agents.services`, `agents.runners`, `agents.skills`, `agents.prices`) and Personal settings › Preferences › Agent (`/me/agent`). Do not copy the UI Library's `agent-chat` block, route the settings pages under business navigation or write Agent settings or preference pages in the App. `client/kit`, `client/runs`, `client/profile`, `client/config` and the route definitions in `client/routes` stay exported for an App's own pages.

Customize in layers, the least that does the job: options (`agents({ headerAction, panel: { width, defaultOpen }, chatPath })`); extension points (`useAgentContext`, `AskAgentButton`, `agents.toolRenderers.add`, `agents.slots.*.add`, `agents.preferenceSections.add`); replacing a part (`agents.components.replace`) or a page (`routeComponentOverrides` on `@nocobase/app-plugin-agents:agentChat` and the settings routes; `headerActionOverrides` on `agent`); and only as a last resort copying the `agent-chat` block with `agents({ headerAction: false, panel: false })`. [UI customization](ui-customization.md) has an example of each.

## OnlineAgent chat

Mount `ChatProvider` from the plugin client chat entry and key it by the authenticated user identity. It owns the shared submission, canonical-history and initial-stream controller for every chat view. New chats use create then messages; legacy start/fallback/restore endpoints are removed. Network uncertainty requires explicit saved-history inspection, never hidden resend or stream reconnect. Existing Runner conversations remain read-only in the switched UI. Ordinary configuration snapshots and custom server tools use `agentsToken.onlineAgent`; see [OnlineAgent chats and business tools](online-agent.md) for configuration, server examples and browser integration.
