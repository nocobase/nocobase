# @nocobase/app-plugin-demo-mode

## 0.2.0-beta.3

### Patch Changes

- df09e63: Ship plugin development guidance with the App's installed Skills, reserve its existing name for @nocobase/app-skills, and guide upgrades through verifying the project replacement before retiring old global installations. Update application and plugin entry points to use the version-matched project Skill.

  Synchronize project Skills as real copies, exclude dependencies installed inside executable examples, and preserve the targets of older project links during migration.

- Updated dependencies [82aa791]
- Updated dependencies [df09e63]
  - @nocobase/app-cli@1.0.0-beta.29

## 0.2.0-beta.2

### Patch Changes

- 14e042c: Automatically use secure, partitioned authentication cookies for HTTPS demo deployments so visitors can stay signed in inside a cross-site iframe. Preserve explicit deployment overrides and the existing cookie policy for HTTP development and non-demo applications.

## 0.2.0-beta.1

### Patch Changes

- f5b51a4: Restore the compact Demo Mode header menu with smaller text, tighter spacing, a narrower dropdown and the application's primary color. Keep account preloading, pending and retry states, keyboard access, and location-preserving switching unchanged.
- Updated dependencies [d78f586]
  - @nocobase/app-plugin-agents@1.0.0-beta.26

## 0.2.0-beta.0

### Minor Changes

- 97d20de: Replace floating and avatar-menu account switching with a standalone DemoModeMenu for application headers. The dropdown combines the demo environment notice, account names and roles, and the current-account check, with preloading and retryable account switching. Applications must mount the new client/menu component in their header and remove the former DemoAccountMenu, accountSwitcher and showFloatingAccountSwitcher integration.

  Replace calls to the former demoModeReactProviders factory with the static reactProviders export from client/react-providers.

  Ensure account switching reloads the document even when the destination differs only by its hash, so the previous account's client state is discarded while preserving the requested location.

### Patch Changes

- 4001a6e: Make the demo settings page read-only by removing data generation, clear, reset and dataset language controls while retaining status, progress, scheduled reset details and account entry links.

  Remove unused settings controls, mutation error messages and obsolete presentation guidance.

- e525be3: Expire matching legacy unpartitioned authentication cookies when Demo Mode issues partitioned sign-in cookies, preserving custom cookie names and scopes and cross-site iframe sessions. Verify the new session before reloading the demo home page so rejected cookies cannot cause an automatic sign-in reload loop.
- Updated dependencies [2e5823a]
- Updated dependencies [2e5823a]
- Updated dependencies [2e5823a]
- Updated dependencies [2e5823a]
- Updated dependencies [2e5823a]
- Updated dependencies [671e1b3]
- Updated dependencies [e5d61bd]
- Updated dependencies [7fbcda4]
- Updated dependencies [7fbcda4]
  - @nocobase/app-plugin-agents@1.0.0-beta.25

## 0.2.0-beta

## 0.1.0-beta.3

### Minor Changes

- 756f3df: Offer every enabled person account through Demo Mode quick sign-in and automatically sign anonymous home-page visitors in as an existing Super Admin. Preserve existing sessions, account passwords and permissions. Add trusted server session creation to Authentication so Demo Mode no longer depends on dataset ownership or known passwords. Preload and share the account list so the account submenu opens immediately on hover, including when the floating entry is hidden.
- 756f3df: Make daily reset deployment-managed and always enabled in Demo Mode. Configure its hour, minute, time zone and dataset language with NOCOBASE_DEMO_RESET_HOUR, NOCOBASE_DEMO_RESET_MINUTE, NOCOBASE_DEMO_RESET_TIMEZONE and NOCOBASE_DEMO_RESET_LANGUAGE (defaults: 03:00 UTC, en-US), then restart the application. Display the resolved schedule and next run as read-only information without save controls or an enable switch. Ignore previously saved schedules and remove schedule writes from the configuration API and service.

### Patch Changes

- 9aaf46e: Publish the Demo Mode enabled flag and provide a shared route helper so applications omit demo management menus and routes outside demo deployments.
- Updated dependencies [756f3df]
- Updated dependencies [6380861]
  - @nocobase/app-plugin-authentication@2.0.0-beta.14
  - @nocobase/app-plugin-agents@1.0.0-beta.24

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
