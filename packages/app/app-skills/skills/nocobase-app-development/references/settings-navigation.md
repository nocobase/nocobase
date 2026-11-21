# System settings navigation

Every administration surface of an application lives under `/settings`, behind one System settings entry at the bottom of the sidebar; what each person configures for themselves lives under `/me` as [personal settings](#personal-settings). Opening it goes straight to the first page the viewer may open, in menu order, as `/me` does for personal settings; while the viewer is on any `/settings` page, the sidebar shows the settings menu instead of the business menu: Back first, then each category as a heading over its modules. A module with several views shows them as tabs. Build every administration page into this structure without the user asking for it, and keep everyday business entries — the inbox, approval to-dos, a team's mailbox, a knowledge base people read — in the business navigation even when their names sound administrative.

## Declare settings pages with `defineSystemSettingsRoutes()`

A settings page is declared with `defineSystemSettingsRoutes()` from `@nocobase/app-client/plugins`, by the application or by a plugin. Its definition is the same as an application page's (`name`, `path`, `auth`, `authz`, `navigation`, `breadcrumb`, `presentation`, `componentLoader`, `children`), and it joins the same route tree, guards, breadcrumbs and lazy loading; only three things differ:

- Its `path` is relative to `/settings`: `path: '/users'` opens at `/settings/users`, and `path: '/'` at `/settings` itself. The category never appears in the URL.
- A top-level page names its category with `parent`, such as `parent: SYSTEM_SETTINGS_CATEGORIES.account` (the id `'account'`). A page naming a category nobody declares, or one the application hides, is shown under `other`, with a warning in development. A top-level group must declare `kind: 'module'`, or `category: true` to add a category, as [categories](#categories) describes.
- Without an `authz` of its own, a settings page admits only unrestricted administrators (`authz: 'unrestricted'`); `auth` defaults to `required`. Declare `authz` with the grant the module's API checks to open it to other roles.

```ts
import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
} from '@nocobase/app-client/plugins';

export default defineSystemSettingsRoutes([
  {
    parent: SYSTEM_SETTINGS_CATEGORIES.data,
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

A plugin contributes its settings pages the same way, from its client entry. `defineAppRoutes()` stays for business pages: an application page cannot join a settings category, and a settings page cannot join an application group.

## The structure is the route tree

| Level    | Declared by                                                                                                                         | Shown as                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Settings | the application's `settings` group, which `withSettingsShell` (`client/routing/settings-shell.ts`) wraps around every settings page | the Settings entry at the bottom of the sidebar; its title and icon are the application's |
| Home     | `settingsHome` at `path: '/'`                                                                                                       | `/settings` itself, which opens the first page the viewer may open                        |
| Category | a built-in category (`systemSettings.<id>`, see [categories](#categories)), or a root group with `category: true` from any package  | a heading in the settings menu, hidden while the viewer can open nothing in it            |
| Module   | a page, or a group with `kind: 'module'`, inside a category                                                                         | one entry in the settings menu (icon and `navigation.title`)                              |
| Tab      | a page with `navigation` inside a module group                                                                                      | a URL-backed tab in `SettingsModulePage`                                                  |

- Give every module `navigation.title`, `navigation.description` (one sentence on what it is for, translated like the title) and an icon; the description is kept for overviews such as the permission editor.
- A module with one view is a page; it renders its content directly, with no single tab. A module with several views is a group with `breadcrumb` whose pages each declare `navigation` and `authz`; wrap each view in `SettingsModulePage` from `client/pages/settings/settings-module-page.tsx`, which derives the tabs, hides the ones the viewer may not open and drops the tab bar when only one remains. The menu entry opens the first tab the viewer may open, and the menu entry stays selected on every view and child page of the module. A module whose page already has its own tabs, such as workflow management's definitions and executions layout, stays a page. The menu has at most two levels, category and module; deeper levels are tabs, child pages or drawers.
- Back returns to the business page the viewer left for settings, kept in session storage; opened directly, it leads to `/`. On a phone the same settings menu is the sidebar drawer.
- Never add another sidebar entry for administration, a second settings layout or a hand-written list of settings pages. Never register a placeholder entry for a capability the application does not use, and never put a dead link or a page that only says "coming soon" in a category.
- The home page (`settingsHome`) is `authz: 'skip'`: it grants nothing and only forwards to the first page the viewer may open, or shows an empty state when there is none. Hiding a menu entry is presentation; every module keeps its own `authz` and its server checks.

## Categories

The categories are built in, so every application and plugin shares the same ones. `@nocobase/app-client` adds them to each settings surface something contributes to, titled with `settings.categories.<id>` and `settings.personal.categories.<id>` in app-client's own namespace (`APP_CLIENT_NAMESPACE`, `@nocobase/app-client`), which ships the English and Chinese titles below, so an application shows them without translating them; to word one differently, give it a title key of the application's own through `defineSettingsCategories()`. Name one with `SYSTEM_SETTINGS_CATEGORIES` or `PERSONAL_SETTINGS_CATEGORIES` from `@nocobase/app-client/plugins`.

| System settings id | Title                    | Order | Holds                                                                        |
| ------------------ | ------------------------ | ----- | ---------------------------------------------------------------------------- |
| `account`          | Accounts and permissions | 100   | users, authentication, roles and permissions, API keys                       |
| `automation`       | Workflows and automation | 200   | workflows, approvals, scheduled jobs                                         |
| `messages`         | Messages                 | 300   | notifications, mailboxes                                                     |
| `ai`               | AI                       | 400   | agents, runners, skills, models, usage, knowledge indexing                   |
| `data`             | Data and files           | 500   | databases, files                                                             |
| `system`           | System                   | 600   | plugins, languages, configuration, cluster, logs, deployment, App Foundation |
| `other`            | Other                    | 900   | pages that fit no other category; cannot be hidden                           |

Personal settings have `account` (100, profile, password, sign-in methods), `preferences` (200, language and appearance) and `other` (900).

- There is no built-in business category. An application or plugin with business configuration adds its own: a root group with `category: true` and a `navigation.order` between the built-in ones, such as `{ name: 'crm', category: true, navigation: { title: 'crm.settings', order: 150 }, children: [] }`. Its id is its name, and other packages join it with `parent: 'crm'`. Declaring an id twice in one settings surface, or redeclaring a built-in one, is a registration error; the same id in System and personal settings are two categories. A category declares no `path` and no `breadcrumb`: it only groups the menu, so its pages keep their own URLs and the trail never names it, wherever the page is filed.
- A plugin that ships ready-made settings pages registers them in a built-in category when the application asks. `@nocobase/app-plugin-agents` does so with `agents({ settingsRoutes: true })` in `client/plugins.ts`: Agents, Runtimes, Skills, Models and Usage join AI at `/settings/agents`, `/settings/runtimes`, `/settings/skills`, `/settings/models` and `/settings/usage`, each keeping its own page grant, and their links to one another (a new skill, back to the library, an agent from Usage) stay under `/settings`. Without the option the plugin registers nothing and the application routes the definitions from `@nocobase/app-plugin-agents/client/routes` where it keeps them.
- The application changes how a category shows, never its id: `defineSettingsCategories('systemSettings', { ai: { title: 'settings.assistants', order: 250 }, automation: { hidden: true } })` in its own route contributions. A hidden category's pages move to `other`; `other` cannot be hidden. Only the application may pass category overrides.
- Every other top-level group is a module and declares `kind: 'module'`; a group with neither is a registration error, so a former category declaration cannot silently become a module.
- Registered routes carry `kind: 'category'` or `kind: 'module'` and, on a category, `category: '<id>'`; the route name is `<surface>.<id>`, such as `systemSettings.account`, for built-in and added categories alike, and a built-in category's `packageName` is `@nocobase/app-client`.

## URLs, breadcrumbs and permissions

Each module and tab keeps a URL of its own under `/settings`, so refresh, bookmarks and Back and Forward work, and the trail reads System settings → module → view with System settings linking back to the home. Navigate inside a module with relative links or `useResolvedPath('..')` rather than a hard-coded absolute path, so the module works wherever it is mounted. Moving an existing page into settings keeps its route `name` and `authz`, so its page id and stored grants keep working. When its URL changes, as for a page that was declared with `defineAppRoutes()` outside `/settings`, keep the old URL working with a redirect and say so in the delivery; route definitions reject wildcards, so a template lists its redirects in `client/lib/settings-redirects.ts`, which the shared `AppRouter` renders; Examples lists the pages it moved and Default lists none.

## Personal settings

Pages where each signed-in person configures their own account — their profile, their own API keys, their mail accounts, language and appearance — are personal settings, declared with `definePersonalSettingsRoutes()` and mounted under `/me`. They follow the same rules as system settings (definitions, built-in categories named by `parent`, a URL that never contains the category, at most two menu levels) with these differences:

- The entry is the first item of the account (avatar) menu, opening `/me`, which leads to the first personal page; Language and Theme stay in that menu as shortcuts to the same preferences. Personal settings never appear in the business menu or the System settings menu.
- Without an `authz` of its own, a personal page admits every signed-in person (`authz: 'skip'`, `auth: 'required'`) and stays out of page permissions. Its server reads and writes only the current person's data, taken from the session, never a user id from the request.
- The categories are the built-in `account`, `preferences` and `other`; the templates ship Language and appearance (`personalAppearance`, `/me/preferences`). While on `/me/*`, the sidebar shows Back, the person's identity and the personal settings menu, and the trail reads Personal settings → page. Back returns to the business page the viewer left, also after moving between system and personal settings.
- A feature that has both an application-wide and a personal side, such as API keys, declares one page on each surface; routes of one surface cannot join a group of the other.

```ts
import {
  definePersonalSettingsRoutes,
  PERSONAL_SETTINGS_CATEGORIES,
} from '@nocobase/app-client/plugins';

export default definePersonalSettingsRoutes([
  {
    parent: PERSONAL_SETTINGS_CATEGORIES.account,
    name: 'myMailAccounts',
    path: '/mail-accounts', // /me/mail-accounts
    navigation: { title: 'me.mailAccounts' },
    breadcrumb: { title: 'me.mailAccounts' },
    componentLoader: () => import('./pages/me/mail-accounts.js'),
  },
]);
```

## Standard modules

| Module                | Route                                                                       | Views                                                                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users                 | `settingsUsers` in `account` (`client/pages/settings/routes.ts`)            | one page                                                                                                                                                                                                             |
| Roles and permissions | `permissionManagement` module in `account`                                  | Roles (`settingsRoles`), Default data scopes (`settingsDefaultAccess`)                                                                                                                                               |
| Workflow management   | `workflows` page in `automation`                                            | its own definitions and executions tabs                                                                                                                                                                              |
| Notifications         | `notificationManagement` module in `messages`, path prefix `/notifications` | the views the application actually has: Delivery logs (`notificationLogs`, the UI Library `notification-logs-ui` page); Notification templates (`notificationTemplates`) when the application provides the catalogue |
| App Foundation        | the Foundation plugin's `foundation` page, in `system`                      | one page                                                                                                                                                                                                             |

The templates' `includeNotificationTemplateRoutes` (`client/pages/settings/notification-routes.ts`) adds the Notification templates view (`/settings/notifications/templates`, `page:notification.templates`) to an existing `notificationManagement` group exactly once, or creates the module in `messages` when notification business is in use. Register Delivery logs and any later notification view in the same group rather than as another module, adding its title key to the application's locales:

```ts
defineSystemSettingsRoutes([
  {
    parent: SYSTEM_SETTINGS_CATEGORIES.messages,
    name: 'notificationManagement',
    kind: 'module',
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

Cover the structure in the application's tests: the sidebar has one Settings entry apart from the business menu; personal settings open from the account menu, not from the sidebar; on every settings URL the sidebar shows the settings menu by category with the module selected and Back leading to the page the viewer came from; `/settings` opens the first page the viewer may open; an empty category is hidden; a restricted viewer sees only the menu entries and tabs their grants open; and the `authz` of moved pages is unchanged, with redirects for any changed URL. `tests/client/settings-navigation.test.ts`, `tests/client/personal-settings-navigation.test.ts`, `tests/client/settings-home.test.tsx` and `tests/client/layout-i18n.test.tsx` in the templates are the starting point.
