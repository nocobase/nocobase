# Visitor entry and presentation

## Default entry

The Client plugin automatically signs anonymous home-page visitors in as an existing Super Admin and provides `/demo-sign-in`. Existing sessions are retained. All enabled person accounts are offered together, including existing administrators and accounts created outside the dataset. No generation or password sign-in setup is required. Super Admin is identified by its unrestricted Permission Set, not by a fixed username. Disabled, deleted and service accounts are excluded.

For a direct link, use `<base path>/demo-sign-in?as=<username>&redirect=/path`. The redirect is application-relative: under `/main`, `/tasks` opens `/main/tasks`. Sign-in reloads the page to discard the previous account's client state.

When Authentication uses partitioned cookies for iframe embedding, quick sign-in expires matching legacy unpartitioned authentication cookies automatically, preserving the configured names, domains and paths. Automatic home entry verifies that the browser sends a usable session before reloading; rejected cookies fall back to normal entry instead of repeated reloads.

## Required header entry

Register `demoMode()` without presentation options and mount `DemoModeMenu` from `@nocobase/app-plugin-demo-mode/client/menu` in the application's top header action area, before the assistant, appearance and avatar controls:

```tsx
import { DemoModeMenu } from '@nocobase/app-plugin-demo-mode/client/menu';

// Inside the existing header action row, alongside the other controls.
<DemoModeMenu />;
```

Use one instance of this standalone component in each application header. The application owns header placement and mounts the component explicitly. If the application has a guest header, mount the same component there too; otherwise `/demo-sign-in` remains available to guests.

The button reads “Demo mode · Switch account”. Its single dropdown explains the demo environment and daily resets, then lists account names and roles with a check beside the current account. Hover, click and keyboard interaction open it. Account lists preload on page entry and refresh after navigation or dataset changes; no application prefetch code is needed. Selecting another account reloads the current location. Pending switches disable repeated actions, and failed switches report an error and can be retried. The component renders nothing outside Demo Mode, and keeps the notice available with an empty-state message when quick sign-in offers no accounts.

## Quick sign-in configuration

- Set `demoMode.quickSignIn: false` in application configuration to disable quick sign-in and automatic home-page sign-in.
- `useDemoAccounts` from `@nocobase/app-plugin-demo-mode/client/accounts` remains available for application integrations that need the public account list or `signIn(username, redirect?)`; the visitor entry uses the shared header component.

## Management presentation

Mount `DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` inside the application's page layout and wrap its route declarations with `demoModeRoutes([...])` from `@nocobase/app-plugin-demo-mode/client` to hide both the route and its menu outside Demo Mode; see the [route example](minimal-example.md#2-wire-existing-composition-roots) for permissions. Keep one owning `PageContainer`.

Use its default components. Supply `label(kind, id)` for application-owned dataset count names and `onDataChange` when the application needs to refresh cached business data. The page is read-only for every account, including administrators. It shows demo data status and progress, the daily reset schedule and system accounts with copyable entry links. Generate, clear, reset and dataset language controls are not available; use the [CLI or API](policies.md#data-operations) for data operations. The reset schedule comes from deployment environment variables; see [daily reset](policies.md#daily-reset). Visitor write policies remain available through [deployment configuration and the API](policies.md#collection-write-exceptions). Simulation and AI have no settings controls; integrate the default-enabled capabilities through the server methods in [simulation](simulation.md).

If host styling requires component replacement, use the public `DemoSettingsComponents` and `DemoSettingsHeaderProps` types. Keep the `components` map stable outside render, forward refs/events/accessibility props, and retain disabled/loading behavior. Omitted slots keep their defaults; no private plugin imports or global style overrides are needed.
