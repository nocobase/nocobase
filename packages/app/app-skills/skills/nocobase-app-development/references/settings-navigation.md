# System settings navigation

Every administration surface of an application lives under `/settings`, behind one Settings entry at the bottom of the sidebar. Opening it shows a home page of cards grouped by category; while the viewer is on any `/settings` page, the sidebar shows the settings menu instead of the business menu: Back first, then each category as a heading over its modules. A module with several views shows them as tabs. Build every administration page into this structure without the user asking for it, and keep everyday business entries — the inbox, approval to-dos, a team's mailbox, a knowledge base people read — in the business navigation even when their names sound administrative.

## Declare settings pages with `defineSettingsRoutes()`

A settings page is declared with `defineSettingsRoutes()` from `@nocobase/app-client/plugins`, by the application or by a plugin. Its definition is the same as an application page's (`name`, `path`, `auth`, `authz`, `navigation`, `breadcrumb`, `presentation`, `componentLoader`, `children`), and it joins the same route tree, guards, breadcrumbs and lazy loading; only three things differ:

- Its `path` is relative to `/settings`: `path: '/users'` opens at `/settings/users`, and `path: '/'` at `/settings` itself. The category never appears in the URL.
- A top-level page names its category with `parent`, such as `parent: 'settingsAccount'`. A category that no package registered is a registration error naming it.
- Without an `authz` of its own, a settings page admits only unrestricted administrators (`authz: 'unrestricted'`); `auth` defaults to `required`. Declare `authz` with the grant the module's API checks to open it to other roles.

```ts
import { defineSettingsRoutes } from '@nocobase/app-client/plugins';

export default defineSettingsRoutes([
  {
    parent: 'settingsSystem',
    name: 'storage',
    path: '/storage', // /settings/storage
    authz: { resource: { type: 'settings', id: 'storage' }, action: 'read' },
    navigation: {
      title: 'settings.storage',
      description: 'settings.storageDescription',
      icon: HardDrive,
    },
    breadcrumb: { title: 'settings.storage' },
    componentLoader: () => import('./pages/settings/storage.js'),
  },
]);
```

A plugin contributes its settings pages the same way, from its client entry, and only references a category; it never declares one. `defineAppRoutes()` stays for business pages: an application page cannot join a settings category, and a settings page cannot join an application group.

## The structure is the route tree

| Level    | Declared by                                                                                                                                                                                                 | Shown as                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Settings | the application's `settings` group, which `withSettingsShell` (`client/routing/settings-shell.ts`) wraps around every settings page                                                                         | the Settings entry at the bottom of the sidebar; its title and icon are the application's               |
| Home     | `settingsHome` at `path: '/'`                                                                                                                                                                               | the `/settings` page of cards                                                                           |
| Category | a root group in the application's `defineSettingsRoutes()`: `settingsAccount`, `settingsBusiness`, `settingsAi`, `settingsSystem` (Default: `pages/settings/shell-routes.ts`; Examples: `client/routes.ts`) | a heading on the home page and in the settings menu, hidden while the viewer can open nothing in it     |
| Module   | a page or a group inside a category                                                                                                                                                                         | one card (icon, `navigation.title`, `navigation.description`, arrow) and one entry in the settings menu |
| Tab      | a page with `navigation` inside a module group                                                                                                                                                              | a URL-backed tab in `SettingsModulePage`                                                                |

- Give every module `navigation.title`, `navigation.description` (one sentence on what it is for, translated like the title) and an icon. A card without a description is incomplete.
- A module with one view is a page; it renders its content directly, with no single tab. A module with several views is a group with `breadcrumb` whose pages each declare `navigation` and `authz`; wrap each view in `SettingsModulePage` from `client/pages/settings/settings-module-page.tsx`, which derives the tabs, hides the ones the viewer may not open and drops the tab bar when only one remains. The card and the menu entry open the first tab the viewer may open, and the menu entry stays selected on every view and child page of the module. A module whose page already has its own tabs, such as workflow management's definitions and executions layout, stays a page. The menu has at most two levels, category and module; deeper levels are tabs, child pages or drawers.
- Category names are shared by every package, so keep them; rename or reorder a category through its title and `navigation.order`, and add an application-specific one in the same `defineSettingsRoutes()`. A plugin page the transform moves into settings (App Foundation) is shown in `settingsSystem`.
- Back returns to the business page the viewer left for settings, kept in session storage; opened directly, it leads to `/`. On a phone the same settings menu is the sidebar drawer.
- Never add another sidebar entry for administration, a second settings layout or a hand-written card list. Never register a placeholder card for a capability the application does not use, and never put a dead link or a page that only says "coming soon" in a category.
- The home page (`settingsHome`) is `authz: 'skip'`: it grants nothing and lists only what the viewer may open. Hiding a card or a menu entry is presentation; every module keeps its own `authz` and its server checks.

## URLs, breadcrumbs and permissions

Each module and tab keeps a URL of its own under `/settings`, so refresh, bookmarks and Back and Forward work, and the trail reads System settings → module → view with System settings linking back to the home. Navigate inside a module with relative links or `useResolvedPath('..')` rather than a hard-coded absolute path, so the module works wherever it is mounted. Moving an existing page into settings keeps its route `name` and `authz`, so its page id and stored grants keep working. When its URL changes, as for a page that was declared with `defineAppRoutes()` outside `/settings`, keep the old URL working with a redirect and say so in the delivery; route definitions reject wildcards, so a template lists its redirects in `client/lib/settings-redirects.ts`, which the shared `AppRouter` renders; Examples lists the pages it moved and Default lists none.

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
defineSettingsRoutes([
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
        // /settings/notifications/logs. The page checks the same grant as GET /api/notifications/logs.
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

Install the block with `yes n | pnpm exec shadcn add @nocobase/notification-logs-ui`. While Delivery logs is the module's only view, the page renders `NotificationLogsPage` from `#extensions/nocobase-notification-logs-ui/index` in a `PageContainer`; the block brings its own heading. When a second view such as Notification templates joins the group, render each view inside `SettingsModulePage` (titled with the module) and render the block as `<NotificationLogsPage showHeading={false} />`, so the module has one heading above its tabs. A copy installed before the block had `showHeading` needs the block updated first, or its heading removed in the installed source.

## Checks

Cover the structure in the application's tests: the sidebar has one Settings entry apart from the business menu; on every settings URL the sidebar shows the settings menu by category with the module selected and Back leading to the page the viewer came from; the home groups the expected cards with their descriptions; an empty category is hidden; a restricted viewer sees only the cards, menu entries and tabs their grants open; and the `authz` of moved pages is unchanged, with redirects for any changed URL. `tests/client/settings-navigation.test.ts`, `tests/client/settings-home.test.tsx` and `tests/client/layout-i18n.test.tsx` in the templates are the starting point.
