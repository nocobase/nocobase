---
'@nocobase/app-plugin-demo-mode': minor
'@nocobase/app-skills': patch
---

Add Demo Mode for isolated demonstration deployments, enabled by the boolean `NOCOBASE_DEMO_MODE` environment variable or `demoMode.enabled` configuration and disabled by default, with application-owned repeatable datasets, full business cleanup, reusable visitor accounts, application-scoped quick sign-in redirects, progress reporting and daily scheduled resets. Track applied credentials across restarts so reset preserves unchanged sessions and applies password changes.

Provide request-scoped write protection with logical-collection exceptions while preserving business authorization. Expose permission-gated data management, revision-safe policy APIs, CLI commands and composable settings components.

Support optional official Agents integration with a persistent simulated model, application-owned Agent simulations and explicitly authorized online conversation policies. Preserve existing global defaults and disable the owned model when Demo Mode is disabled. Document raw OpenAI JSON and streaming response contracts. Non-AI applications can use demo data without installing Agents. Publish structural service contracts and browser-safe shared types.

Publish a discoverable integration Skill with capability prerequisites, an executable minimal example, settings-based management authorization, existing-business adaptation and verification guidance. Distinguish ordinary application sample data from a dedicated demo system; share application-owned generators without resetting sample execution history. Keep optional AI and scheduling work out of the initial non-AI demo path.

Allow administrators with Agents model-service permissions to configure real demo chat endpoints and write-only API keys directly from the demo page, using Agents encrypted storage and preserving other models and default selections.
