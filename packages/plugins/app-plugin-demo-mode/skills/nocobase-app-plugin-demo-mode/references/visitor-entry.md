# Visitor entry and presentation

## Default entry

The Client plugin automatically signs anonymous home-page visitors in as an existing Super Admin and provides `/demo-sign-in`. Existing sessions are retained. All enabled person accounts are offered together, including existing administrators and accounts created outside the dataset. No generation or password sign-in setup is required. Super Admin is identified by its unrestricted Permission Set, not by a fixed username. Disabled, deleted and service accounts are excluded.

Account role labels come from the dataset when provided. Otherwise, the API returns directly assigned visible Permission Set titles in optional `roleTitles`, preferring unrestricted administrator sets. Each title is a string or a `{ key, ns, defaultValue }` translation descriptor. The `role` string retains plain titles or Permission Set keys for API consumers. `useDemoAccounts()` translates the descriptors through the owning plugins' registered client namespaces, deduplicates display names and joins them into `role`. Missing translations use their Permission Set keys; accounts without a label or visible assignment have no subtitle. Default home-page sign-in selects an eligible administrator without loading dataset labels or preparing role names.

For a direct link, use `<base path>/demo-sign-in?as=<username>&redirect=/path`. The redirect is application-relative: under `/main`, `/tasks` opens `/main/tasks`. Sign-in reloads the page to discard the previous account's client state.

An enabled Demo Mode deployment whose `app.publicOrigin` is HTTPS automatically defaults Authentication cookies to `SameSite=None; Secure; Partitioned`, including when TLS terminates at a reverse proxy. Set the public origin to the visitor-facing HTTPS origin; no application-specific `server/config/auth.ts` code or extra Cookie configuration is needed. HTTP development, an unspecified public origin and deployments with Demo Mode disabled keep their existing policy. Explicit deployment values under `auth.advanced.defaultCookieAttributes` override these defaults; set `sameSite: lax` together with `partitioned: false` to opt out. Restart the application after changing the origin or cookie policy.

Quick sign-in expires matching legacy unpartitioned authentication cookies automatically, preserving the configured names, domains and paths. Automatic home entry verifies that the browser sends a usable session before reloading; rejected cookies fall back to normal entry instead of repeated reloads. Verify an embedded demo from a different site as well as in its own tab: the issued session cookie must include `SameSite=None; Secure; Partitioned`, and the subsequent `/api/auth/get-session` request must recognize the visitor.

## Required entry loading

The application owns the loading UI for automatic home entry and direct account links. In `client/react-providers.ts`, connect its existing `Loading` component through `DemoEntryLoadingContext`; keep `demoMode()` unchanged. This is required application integration, including when upgrading an existing demo. The plugin supplies no spinner, styling or loading copy; without this provider it renders nothing during automatic entry.

```ts
import { DemoEntryLoadingContext } from '@nocobase/app-plugin-demo-mode/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  createElement,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { Loading } from '#components/loading';

function DemoEntryLoadingProvider({
  children,
}: PropsWithChildren): ReactElement {
  const { t } = useTranslation();
  return createElement(
    DemoEntryLoadingContext,
    {
      value: createElement(Loading, {
        fullscreen: true,
        label: t('status.loading'),
      }),
    },
    children,
  );
}
```

Add this entry to the existing `defineClientReactProviders([...])` array, preserving the other providers:

```ts
{
  name: 'demo-entry-loading',
  layer: 'root',
  component: DemoEntryLoadingProvider,
},
```

Use the application's existing loading label and translate it in this root provider, before the plugin page's namespace takes effect. Reuse the application's loader and translations; do not copy a loading component into the plugin or add demo-specific loading text. Verify that anonymous home entry and `/demo-sign-in?as=<username>` show this same loader while sign-in is pending, then reload on success or leave normal entry available on failure.

## Required header entry

Register `demoMode()` without presentation options and mount `DemoModeMenu` from `@nocobase/app-plugin-demo-mode/client/menu` in the application's top header action area, before the assistant, appearance and avatar controls:

```tsx
import { DemoModeMenu } from '@nocobase/app-plugin-demo-mode/client/menu';

// Inside the existing header action row, alongside the other controls.
<DemoModeMenu />;
```

Use one instance of this standalone component in each application header. The application owns header placement and mounts the component explicitly. If the application has a guest header, mount the same component there too; otherwise `/demo-sign-in` remains available to guests.

The button reads “Demo mode · Switch account”. Its single dropdown explains the demo environment and daily resets, then lists account names and roles with a check beside the current account. Hover, click and keyboard interaction open it. Account lists preload on page entry and refresh after navigation or dataset changes. Language switches translate the cached titles without another request, including responses that arrive after a switch. No application prefetch code is needed. Selecting another account reloads the current location. Pending switches disable repeated actions, and failed switches report an error and can be retried. The component renders nothing outside Demo Mode, and keeps the notice available with an empty-state message when quick sign-in offers no accounts.

## Quick sign-in configuration

- Set `demoMode.quickSignIn: false` in application configuration to disable quick sign-in and automatic home-page sign-in.
- `useDemoAccounts` from `@nocobase/app-plugin-demo-mode/client/accounts` remains available for application integrations that need the public account list or `signIn(username, redirect?)`; the visitor entry uses the shared header component.

## Management presentation

Mount `DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` inside the application's page layout and wrap its route declarations with `demoModeRoutes([...])` from `@nocobase/app-plugin-demo-mode/client` to hide both the route and its menu outside Demo Mode; see the [route example](minimal-example.md#2-wire-existing-composition-roots) for permissions. Keep one owning `PageContainer`.

Use its default components. Supply `label(kind, id)` for application-owned dataset count names and `onDataChange` when the application needs to refresh cached business data. The page is read-only for every account, including administrators. It shows demo data status and progress, the daily reset schedule and system accounts with copyable entry links. Generate, clear, reset and dataset language controls are not available; use the [CLI or API](policies.md#data-operations) for data operations. The reset schedule comes from deployment environment variables; see [daily reset](policies.md#daily-reset). Visitor write policies remain available through [deployment configuration and the API](policies.md#collection-write-exceptions). Simulation and AI have no settings controls; integrate the default-enabled capabilities through the server methods in [simulation](simulation.md).

If host styling requires component replacement, use the public `DemoSettingsComponents` and `DemoSettingsHeaderProps` types. Keep the `components` map stable outside render, forward refs/events/accessibility props, and retain disabled/loading behavior. Omitted slots keep their defaults; no private plugin imports or global style overrides are needed.
