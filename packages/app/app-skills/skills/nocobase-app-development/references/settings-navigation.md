# System settings navigation

Every administration surface of an application lives under one System settings entry in the sidebar. Opening it shows a home page of cards grouped by category; a card opens one module; a module with several views shows them as tabs. Build every administration page into this structure without the user asking for it, and keep everyday business entries — the inbox, approval to-dos, a team's mailbox, a knowledge base people read — in the business navigation even when their names sound administrative.

## The structure is the route tree

The templates register the structure in `client/routes.ts` (Default: `client/pages/settings/shell-routes.ts`; Examples: its `systemManagement` group) and the navigation transform in `client/lib/navigation-transform.ts` renders it. Nothing is hand-written per card: the home page and the tabs read the registered routes through the shell's single permission check.

| Level          | Route                                                                                       | Shown as                                                                   |
| -------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Settings group | the group holding `settingsHome` (`settings` in Default, `systemManagement` in Examples)    | one sidebar entry, selected on every page below it                         |
| Category       | a direct child group: `settingsAccount`, `settingsBusiness`, `settingsAi`, `settingsSystem` | a heading on the home page, hidden while the viewer can open nothing in it |
| Module         | a page or a group inside a category                                                         | one card: icon, `navigation.title`, `navigation.description`, arrow        |
| Tab            | a page with `navigation` inside a module group                                              | a URL-backed tab in `SettingsModulePage`                                   |

- Register a module with `parent` naming its category, and give it `navigation.title`, `navigation.description` (one sentence on what it is for, translated like the title) and an icon. A card without a description is incomplete.
- A module with one view is a page; it renders its content directly, with no single tab. A module with several views is a group with `breadcrumb` whose pages each declare `navigation` and `authz`; wrap each view in `SettingsModulePage` from `client/pages/settings/settings-module-page.tsx`, which derives the tabs, hides the ones the viewer may not open and drops the tab bar when only one remains. The card opens the first tab the viewer may open. A module whose page already has its own tabs, such as workflow management's definitions and executions layout, stays a page.
- Categories are application-owned: rename, reorder (`navigation.order`), add or remove them in the same place. A page registered directly under the settings group, as a plugin's settings page is (App Foundation), is shown in `settingsSystem`.
- Never add another sidebar entry, a second settings layout, a resident settings sidebar or a hand-written card list. Never register a placeholder card for a capability the application does not use, and never put a dead link or a page that only says "coming soon" in a category.
- The home page (`settingsHome`) is `authz: 'skip'`: it grants nothing and lists only what the viewer may open. Hiding a card is presentation; every module keeps its own `authz` and its server checks.

## URLs, breadcrumbs and permissions

Each module and tab keeps a URL of its own, so refresh, bookmarks and Back and Forward work, and the trail reads System settings → module → view with System settings linking back to the home. Moving an existing page into the structure changes its `parent` only: keep its route `name`, `path` and `authz`, so its page id, stored grants and deep links keep working. A pathless group adds nothing to its children's URLs; in Default the settings group's `/settings` prefix is already part of the existing settings URLs. If a URL must change, keep the old one working with a redirect route and say so in the delivery.

## Standard modules

| Module                | Route                                                                            | Views                                                                                                                                                                                                                |
| --------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users                 | `settingsUsers` in `settingsAccount` (`client/pages/settings/routes.ts`)         | one page                                                                                                                                                                                                             |
| Permission management | `permissionManagement` group in `settingsAccount`                                | Roles and permissions (`settingsRoles`), Default data scopes (`settingsDefaultAccess`)                                                                                                                               |
| Workflow management   | `workflows` page in `settingsBusiness`                                           | its own definitions and executions tabs                                                                                                                                                                              |
| Notifications         | `notificationManagement` group in `settingsSystem`, path prefix `/notifications` | the views the application actually has: Delivery logs (`notificationLogs`, the UI Library `notification-logs-ui` page); Notification templates (`notificationTemplates`) when the application provides the catalogue |
| App Foundation        | the Foundation plugin's `foundation` page, shown in `settingsSystem`             | one page                                                                                                                                                                                                             |

The templates' `includeNotificationTemplateRoutes` (`client/pages/settings/notification-routes.ts`) adds the Notification templates view (`/settings/notifications/templates`, `page:notification.templates`) to an existing `notificationManagement` group exactly once, or creates the group in `settingsSystem` when notification business is in use. Register Delivery logs and any later notification view in the same group rather than as another card, adding its title key to the application's locales:

```ts
defineAppRoutes([
  {
    parent: 'settingsSystem',
    name: 'notificationManagement',
    navigation: {
      title: 'settings.notificationManagement',
      description: 'settings.notificationManagementDescription',
      icon: Bell,
    },
    breadcrumb: { title: 'settings.notificationManagement' },
    children: [
      {
        // Default: /settings/notifications/logs. The page checks the same grant as GET /api/notifications/logs.
        name: 'notificationLogs',
        path: '/notifications/logs',
        auth: 'required',
        authz: {
          resource: { type: 'page', id: 'notification.logs' },
          action: 'access',
        },
        navigation: { title: 'settings.notificationLogs' },
        breadcrumb: { title: 'settings.notificationLogs' },
        componentLoader: () => import('./pages/settings/notification-logs.js'),
      },
    ],
  },
]);
```

Install the block with `yes n | pnpm exec shadcn add @nocobase/notification-logs-ui`. While Delivery logs is the module's only view, the page renders `NotificationLogsPage` from `#extensions/nocobase-notification-logs-ui/index` in a `PageContainer`; the block brings its own heading. When a second view such as Notification templates joins the group, render each view inside `SettingsModulePage` (titled with the module) and drop the block's own heading in the installed source, so the module has one heading above its tabs.

## Checks

Cover the structure in the application's tests: the sidebar has one settings entry selected on every settings URL, the home groups the expected cards with their descriptions, an empty category is hidden, a restricted viewer sees only the cards and tabs their grants open, and the existing URLs and `authz` of moved pages are unchanged. `tests/client/settings-navigation.test.ts` and `tests/client/settings-home.test.tsx` in the templates are the starting point.
