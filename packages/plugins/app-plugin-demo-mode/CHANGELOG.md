# @nocobase/app-plugin-demo-mode

## 0.1.0-beta.2

### Patch Changes

- f92d471: Preserve the executing administrator's account and existing permissions during demo business-data cleanup, including failed resets. Reuse retained identities on regeneration, continue cleaning ordinary demo accounts, and persist the operation's actor for scheduled retries.
- 3dc3f77: Show the demo administration page as a single page instead of two tabs: the demo data, daily reset and demo accounts cards now appear together. The `TabsList` and `TabsTrigger` component slots and the `activeTabLabel` header prop are removed, and a `?tab=` query parameter is ignored.
- 58531da: Require HTTP-compatible UUID and clipboard helpers in browser source while preserving Node APIs. Use the shared helpers for mail composition, demo links, example records, template copy actions and workflow request identifiers.
- Updated dependencies [58531da]
- Updated dependencies [7f36872]
  - @nocobase/app-client@4.0.0-beta.3
  - @nocobase/app-plugin-agents@1.0.0-beta.23
  - @nocobase/jobs@0.1.0-beta.4
  - @nocobase/app-cli@1.0.0-beta.27
  - @nocobase/app-server@3.0.0-beta.3
  - @nocobase/db@1.0.0-beta.22
  - @nocobase/i18n@2.0.0-beta.1
  - @nocobase/service-provider@0.0.2-beta.2
  - @nocobase/app-plugin-authentication@2.0.0-beta.13
  - @nocobase/app-plugin-authorization@1.0.0-beta.31
  - @nocobase/app-plugin-users@2.0.0-beta.9

## 0.1.0-beta.1

### Patch Changes

- ef9ae6f: Simplify the demo settings page to Overview and Daily reset by removing visitor write, simulation and AI controls. Remove the obsolete chatTools option and DemoChatTool type, and restrict label kinds to count. Preserve existing write policies and their configuration APIs. Enable registered simulation adapters and integrated demo chat by default, deriving tool behavior from application-provided mocks or explicit local reads while preserving saved overrides. Keep application integration optional and leave ordinary Agent model selection unchanged.
- Updated dependencies [d490379]
- Updated dependencies [d490379]
- Updated dependencies [d490379]
- Updated dependencies [d490379]
- Updated dependencies [d490379]
- Updated dependencies [d490379]
- Updated dependencies [4c98f67]
- Updated dependencies [01e03b7]
  - @nocobase/app-plugin-agents@1.0.0-beta.22

## 0.1.0-beta.0

### Minor Changes

- 9c20e2d: Add Demo Mode for isolated demonstration deployments, enabled by the boolean `NOCOBASE_DEMO_MODE` environment variable or `demoMode.enabled` configuration and disabled by default, with application-owned repeatable datasets, full business cleanup, reusable visitor accounts, application-scoped quick sign-in redirects, progress reporting and daily scheduled resets. Track applied credentials across restarts so reset preserves unchanged sessions and applies password changes.

  Provide request-scoped write protection with logical-collection exceptions while preserving business authorization. Expose permission-gated data management, revision-safe policy APIs, CLI commands and composable settings components.

  Support optional official Agents integration with a persistent simulated model, application-owned Agent simulations and explicitly authorized online conversation policies. Preserve existing global defaults and disable the owned model when Demo Mode is disabled. Document raw OpenAI JSON and streaming response contracts. Non-AI applications can use demo data without installing Agents. Publish structural service contracts and browser-safe shared types.

  Publish a task-focused integration Skill with capability prerequisites, an executable non-AI example, settings-based management authorization and application-owned datasets and cleanup. Distinguish ordinary sample data from dedicated demo deployments, use automatic daily reset defaults and keep customization and simulation guidance conditional on the requested demo.

### Patch Changes

- Updated dependencies [39fa974]
- Updated dependencies [005418a]
- Updated dependencies [dfc9be3]
  - @nocobase/app-plugin-agents@1.0.0-beta.21

## 0.0.1

- Introduce isolated demo deployments enabled by the boolean `NOCOBASE_DEMO_MODE` environment variable or `demoMode.enabled` configuration, disabled by default, with request-scoped write protection, logical-collection exceptions and application-owned repeatable data generation and cleanup.
- Provide reusable visitor accounts, quick sign-in with application-scoped redirects, permission-gated lifecycle APIs and CLI, reset progress, persisted operation leases and a daily reset on the application's jobs service, firing once a day at the configured local time and every night at 03:00 by default. Preserve sessions for unchanged accounts and apply changed passwords using persisted salted snapshots.
- Offer optional official Agents integration, a persistent simulated model, application-owned simulations and explicit online conversation policies. Preserve existing global model defaults and disable the owned model when Demo Mode is disabled. Document the gateway's raw OpenAI JSON and server-sent event responses.
- Publish structural service contracts, composable management components with collection write exceptions, demo accounts and standard localized error handling, and a task-focused integration Skill with settings-based management authorization, an executable non-AI example and application-owned business adaptation. Use automatic reset defaults and keep customization and simulation guidance conditional on the requested demo.
