---
name: Capability details explain current configuration first
description: Use one three-part layout for capability details, with actual configuration evidence and expandable Agent actions for additions and improvements.
type: feedback
modified: 2026-11-08
---

All capability details use one layout: a one-line purpose and documentation link in the header, a current-application card with feature-specific configuration evidence and real entry links, and an “Add or improve with an Agent” section. Keep further configuration goals in that third section as expandable requests with setup steps. Do not put tutorials, scenarios or technical reference sections back into the main body. Use shared page components across generic entries, database, languages, Agent, authorization and examples.

**Why:** A package-oriented catalog or a prompt library does not explain the application's actual setup. Describe effective configuration, including overrides and defaults.

**How to apply:** Keep a database overview in Features and extensions, use Database Explorer for collections and fields, and reserve complete configuration management for System settings when it exists. Reuse the same data rather than introducing a second configuration source. Never infer per-field configuration provenance or treat an omitted setting as disabled.

Do not split Agent status by frontend/backend registration. Show actual management entries and keep implementation details inside development requests, distinguished from messages to a business chat assistant.

In these capability pages, keep the product term “Agent” in English, including Chinese titles and instructions; do not translate it as “智能体”.

Use “已配置 / 未配置” (Configured / Not configured) for capability status labels, including Agent. Partial configuration remains explicit, and unavailable evidence stays unknown. The owner corrected the API key overview: plugin registration does not establish configuration. Use feature-specific evidence and state its scope. For API Keys, the owner subsequently clarified that configuration is complete only when the application provides a management interface; personal key counts and API availability are separate facts and must not determine this status.

Keep one short purpose summary in the detail header, followed by its documentation link and then the current-application section. Remove repeated introductions; place unique information under its relevant configuration action.

Ground API Keys setup requests in its Skill and verify claims against current APIs. Keep the detail to a one-line purpose, documentation link, current management interface availability and Agent setup requests with expandable steps. The current-application card has two independently detected entries: My API keys and Application API keys. Put each missing interface’s setup guide below the card. Do not show key counts, global rules or usage tutorials here. Application credential ownership and administrator scope remain to be confirmed before implementing that management page; do not assume a personal-key aggregate or an independent application identity.

When an API Keys management interface is missing, offer an editable, copyable request for the development Agent to implement the page, account-menu entry, real API operations and registered management route. This is a manual handoff unless task dispatch is actually integrated. An existing page denied to the current viewer is not a missing page.

The owner clarified that Features and extensions is reusable across all applications. Keep its detail pages, Agent guidance, copy, runtime discovery and design notes in `packages/plugins/app-plugin-foundation`; templates only register the plugin and supply ordinary application options. Do not maintain separate Default and Examples implementations or require each application to wire every detail loader. Actual business management pages remain with their owning application or plugin.
