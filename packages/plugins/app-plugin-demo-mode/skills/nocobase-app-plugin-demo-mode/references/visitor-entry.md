# Visitor entry and presentation

## Default entry

The Client plugin automatically signs anonymous home-page visitors in as an existing Super Admin and provides `/demo-sign-in` and a floating account switcher. Existing sessions are retained. All enabled person accounts are offered together, including existing administrators and accounts created outside the dataset. No generation or password sign-in setup is required. Super Admin is identified by its unrestricted Permission Set, not by a fixed username. Disabled, deleted and service accounts are excluded.

For a direct link, use `<base path>/demo-sign-in?as=<username>&redirect=/path`. The redirect is application-relative: under `/main`, `/tasks` opens `/main/tasks`. Sign-in reloads the page to discard the previous account's client state.

When Authentication uses partitioned cookies for iframe embedding, quick sign-in expires matching legacy unpartitioned authentication cookies automatically, preserving the configured names, domains and paths. Automatic home entry verifies that the browser sends a usable session before reloading; rejected cookies fall back to normal entry instead of repeated reloads.

## Customize only when needed

- Set `demoMode.quickSignIn: false` in application configuration to disable quick sign-in and automatic home-page sign-in.
- For an existing account menu, register `demoMode({ accountSwitcher: 'menu' })` and place `DemoAccountMenu` from `@nocobase/app-plugin-demo-mode/client/account-menu` inside its Base UI menu content, before sign-out. Guests retain the floating entry. Account lists preload on page entry even when the floating entry is hidden, and the submenu opens immediately on hover; no application prefetch code is needed.
- Set the Client option `showFloatingAccountSwitcher: false` to hide the floating entry. This changes presentation; it does not disable the sign-in route.
- For a custom entry UI, use `useDemoAccounts` from `@nocobase/app-plugin-demo-mode/client/accounts`; it supplies the public account list and `signIn(username, redirect?)`.

## Management presentation

Mount `DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` inside the application's page layout and wrap its route declarations with `demoModeRoutes([...])` from `@nocobase/app-plugin-demo-mode/client` to hide both the route and its menu outside Demo Mode; see the [route example](minimal-example.md#2-wire-existing-composition-roots) for permissions. Keep one owning `PageContainer`.

Use its default components. Supply `label(kind, id)` for application-owned dataset count names and `onDataChange` when the application needs to refresh cached business data. The page shows demo data, a read-only daily reset schedule and system accounts with copyable entry links. The reset schedule comes from deployment environment variables; see [daily reset](policies.md#daily-reset). Visitor write policies remain available through [deployment configuration and the API](policies.md#collection-write-exceptions). Simulation and AI have no settings controls; integrate the default-enabled capabilities through the server methods in [simulation](simulation.md).

If host styling requires component replacement, use the public `DemoSettingsComponents` and `DemoSettingsHeaderProps` types. Keep the `components` map stable outside render, forward refs/events/accessibility props, and retain disabled/loading behavior. Omitted slots keep their defaults; no private plugin imports or global style overrides are needed.
