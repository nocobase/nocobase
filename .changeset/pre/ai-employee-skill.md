---
'@nocobase/app-skills': patch
---

Rewrite the AI Employee App Skill as a build order that matches the code

The `nocobase-app-plugin-ai-employee` Skill synchronizes into every application that depends on the plugin, so an agent writes what it says. It is rewritten as a build order — configure a model, write the tool, register, define the employee, mount the chat, verify — with a table of what to build for what the user asked and completion checks that are observed rather than read back, and every rule in it is checked against the current code:

- **Setup.** How to install and upgrade the `nocobase-ai` Registry item, and how to keep an LLM key out of the repository and the transcript: the user runs a hidden-input command built for their own environment and verified with fake values, with the exact rules for writing it into a shell profile, `config.yml` or `.env`, and why `.env.local` and the starting environment override `.env`.
- **Chat.** The readiness gate, `defaultEmployee`, attachments enabled on every chat surface unless the user declines them, `enableWebSearch` on every chat surface unless the user declines web search, controlled dialog and side-panel surfaces wired to the controller that a floating trigger opens, tasks and their tool allowlist, page context and forms, and the plugin's working example pages under `/dev/ai-components`, with what not to copy from them.
- **Server.** Employees and tools register only through `AIResourceRegistrar`, and Skills only as `SKILL.md` files; the agent contracts — state, context and declared dependencies, the `invoke()` result, interrupts, error codes; running an agent unattended, as a real service account, with the conversation's own `skillSettings`, a bounded interrupt loop and a timezone; and `createAgent()` with its Skills and checkpointer.
- **Configuration.** LLM services and `enabledModels`, MCP servers — credentials in `headers` or `env`, what is persisted and what a rename discards — attachment storage, and web search only on a provider that searches.
- **Runtime extensions.** A new reference covers dynamic tools, a custom LLM provider and a direct model call. It replaces the separate `nocobase-ai-employee` Skill that sat unpublished in `@nocobase/ai-employee`, which no application ever received.

The application development Skill in `@nocobase/app-skills` names the AI Employee plugin in its table of installed plugins, so an agent building an assistant feature learns that the plugin and its Skill exist.
