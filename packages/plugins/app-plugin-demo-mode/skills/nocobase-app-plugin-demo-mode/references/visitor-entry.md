# Visitor entry and presentation

## Default entry

The Client plugin provides `/demo-sign-in` and a floating account switcher automatically. Generate the dataset first and enable the host's password sign-in. Use one shared account definition for listing and creation, as described in [visitor accounts](adapting-data.md#visitor-accounts).

For a direct link, use `<base path>/demo-sign-in?as=<username>&redirect=/path`. The redirect is application-relative: under `/main`, `/tasks` opens `/main/tasks`. Sign-in reloads the page to discard the previous account's client state.

## Customize only when needed

- Set `demoMode.quickSignIn: false` in application configuration to disable quick sign-in.
- For an existing account menu, register `demoMode({ accountSwitcher: 'menu' })` and place `DemoAccountMenu` from `@nocobase/app-plugin-demo-mode/client/account-menu` inside its Base UI menu content, before sign-out. Guests retain the floating entry.
- Set the Client option `showFloatingAccountSwitcher: false` to hide the floating entry. This changes presentation; it does not disable the sign-in route.
- For a custom entry UI, use `useDemoAccounts` from `@nocobase/app-plugin-demo-mode/client/accounts`; it supplies the public account list and `signIn(username, redirect?)`.

## Management presentation

Mount `DemoModeSettings` from `@nocobase/app-plugin-demo-mode/client/settings` inside the application's page layout; see the [route example](minimal-example.md#2-wire-existing-composition-roots) for permissions. Keep one owning `PageContainer`.

Use its default components. Supply `label(kind, id)` for application-owned count/adapter/tool names, `chatTools` for online chat tool policies and `onDataChange` when the application needs to refresh cached business data.

If host styling requires component replacement, use the public `DemoSettingsComponents` and `DemoSettingsHeaderProps` types. Keep the `components` map stable outside render, forward refs/events/accessibility props, and retain disabled/loading behavior. Tabs replacements must use the same Base UI peer instance. Omitted slots keep their defaults; no private plugin imports or global style overrides are needed.
