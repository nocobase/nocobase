---
name: nocobase-app-plugin-agents
description: Register the Agents plugin in a NocoBase App and configure it (agents.* in config.yml), contribute subjects, scopes, business actions, agent defaults, the App's own agents, CLI commands and reports through agentsToken, enable the agents discovered from runners, set up model services for the App's own model calls, connect runners (registration tokens, protocol, upgrade_required), build and serve the CLI and runner tarballs (pnpm nocobase cli build, --runner), or work out why a run, a runner or a model fails.
metadata:
  short-description: Agents, runners, model services and their distribution
---

# Agents App Plugin

Use this Skill when an App gives people agents to work with: agents that drive a coding tool (Claude Code, Codex, OpenCode, Pi) on a runner someone connects, one for each tool and model the runners report. Use it as well to build the App's CLI and the runner as tarballs the App serves, and to diagnose a run, a runner or a model that does not work. Do not use it for the business data agents act on; that stays with `nocobase-app-development` and the plugins that own it.

The package README is the full reference: read it at `node_modules/@nocobase/app-plugin-agents/README.md` (in this repository, `packages/plugins/app-plugin-agents/README.md`). The references below say what to do and point to its sections rather than repeating them.

## Key rules

- The plugin knows no business of its own. Subjects, scopes, business actions, the instructions and actions every discovered agent gets, CLI commands and report pages are the App's, contributed through `agentsToken` from `@nocobase/app-plugin-agents/server/tokens` when the App's providers boot. With nothing contributed, agents still work in conversations.
- Nobody creates agents: each coding tool and model a runner reports becomes one, pending until someone who manages agents writes what it is good at and enables it. Only enabled agents get work, and only on a runner that is online, has the agent's tool signed in with its model, and whose owner's local policy lets it take the work. There are no online agents; model services serve the App's own model calls.
- Variables and model service keys are sealed with the App's secrets service: configure `secrets.keys` before storing any, or the API answers `SECRETS_KEY_MISSING` (503).
- The plugin registers no pages. The App routes the exported pages and mounts the chat; the App also binds `agentsAccessToken`, or every business action level is `none`.
- `subjects.register`'s `context.assemble`, brief sections and mounts run inside the claim's transaction: database reads only, never a network or a model call. Read anything else in the optional `prepare(run)`.
- Tarballs are built by `pnpm nocobase cli build` (the App's CLI) and `cli build --runner` (`nocobase-runner`), either as separate CI artifacts mounted into `storage/runners/dist` (or `agents.dist.dir`), or by the App's own `pnpm build` into its build output (universal packages, at the versions it was built with) and served from there. Never commit them.
- In examples, name the App's CLI after the App (`acme`), never `nocobase` or `nocobase-runner`.

## References

| Task                                                                                                                                                                                  | Read                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Register the plugin, its prerequisites and `agents.*` configuration, mount the pages and the chat                                                                                     | [Setup and configuration](references/setup-and-config.md)                          |
| Contribute subjects, scopes, actions, agent defaults, the App's own agents, CLI commands, people, reports, mounts                                                                     | [Extension points](references/extension-points.md)                                 |
| Agents discovered from runners, the model catalog, enabling agents, availability, the App's own agents                                                                                | [Agents](references/agents.md)                                                     |
| Model services, the model gateway, vectors                                                                                                                                            | [Model services](references/model-services.md)                                     |
| Register runners, how claims and heartbeats work, local policy, protocol and `upgrade_required`                                                                                       | [Runners](references/runners.md)                                                   |
| Build the CLI and runner tarballs, serve them, CI artifacts, install script, download tokens, installing without a browser (API key, `install-token create`), updates, the npm runner | [Distribution](references/distribution.md)                                         |
| Variables and secrets, the skill library, chat attachments, usage, prices and reports                                                                                                 | [Variables, skills, attachments and usage](references/variables-skills-usage.md)   |
| Check that everything works, and diagnose failures                                                                                                                                    | [Verification and troubleshooting](references/verification-and-troubleshooting.md) |
