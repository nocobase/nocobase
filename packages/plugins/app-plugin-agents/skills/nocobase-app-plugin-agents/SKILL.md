---
name: nocobase-app-plugin-agents
description: Register the Agents plugin in a NocoBase App and configure it (agents.* in config.yml), contribute subjects, scopes, business actions, presets, CLI commands and reports through agentsToken, set up online agents and model services, connect runners (registration tokens, protocol, upgrade_required), build and serve the CLI and runner tarballs (pnpm nocobase cli build, --runner), or work out why a run, a runner or a model fails.
metadata:
  short-description: Agents, runners, model services and their distribution
---

# Agents App Plugin

Use this Skill when an App gives people agents to work with: online agents that answer through a model service on the server, or work agents that drive a coding tool (Claude Code, Codex, OpenCode, Pi) on a runner someone connects. Use it as well to build the App's CLI and the runner as tarballs the App serves, and to diagnose a run, a runner or a model that does not work. Do not use it for the business data agents act on; that stays with `nocobase-app-development` and the plugins that own it.

The package README is the full reference: read it at `node_modules/@nocobase/app-plugin-agents/README.md` (in this repository, `packages/plugins/app-plugin-agents/README.md`). The references below say what to do and point to its sections rather than repeating them.

## Key rules

- The plugin knows no business of its own. Subjects, scopes, business actions, presets, CLI commands and report pages are the App's, contributed through `agentsToken` from `@nocobase/app-plugin-agents/server/tokens` when the App's providers boot. With nothing contributed, agents still work in conversations.
- An agent's type (`runner` or `online`) is chosen once and never changes. Online agents need a model service and no runner; runner agents need a runner that is online, has the agent's coding tool installed and signed in, and whose owner's local policy lets it take the work.
- Variables and model service keys are sealed with the App's secrets service: configure `secrets.keys` before storing any, or the API answers `SECRETS_KEY_MISSING` (503).
- The plugin registers no pages. The App routes the exported pages and mounts the chat; the App also binds `agentsAccessToken`, or every business action level is `none`.
- `subjects.register`'s `context.assemble`, brief sections and mounts run inside the claim's transaction: database reads only, never a network or a model call. Read anything else in the optional `prepare(run)`.
- Tarballs are built by `pnpm nocobase cli build` (the App's CLI) and `cli build --runner` (`nocobase-runner`) as separate CI artifacts and mounted into `storage/runners/dist` (or `agents.dist.dir`). Never bake them into the App's image or commit them.
- In examples, name the App's CLI after the App (`acme`), never `nocobase` or `nocobase-runner`.

## References

| Task                                                                                                                  | Read                                                                               |
| --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Register the plugin, its prerequisites and `agents.*` configuration, mount the pages and the chat                     | [Setup and configuration](references/setup-and-config.md)                          |
| Contribute subjects, scopes, actions, presets, CLI commands, people, reports, brief sections, mounts                  | [Extension points](references/extension-points.md)                                 |
| Online agents, model services, the model gateway, consultations, vectors                                              | [Online agents and model services](references/online-agents.md)                    |
| Register runners, how claims and heartbeats work, local policy, protocol and `upgrade_required`                       | [Runners](references/runners.md)                                                   |
| Build the CLI and runner tarballs, serve them, CI artifacts, install script, download tokens, updates, the npm runner | [Distribution](references/distribution.md)                                         |
| Variables and secrets, the skill library, chat attachments, usage, prices and reports                                 | [Variables, skills, attachments and usage](references/variables-skills-usage.md)   |
| Check that everything works, and diagnose failures                                                                    | [Verification and troubleshooting](references/verification-and-troubleshooting.md) |
