---
'@nocobase/app-plugin-api-keys': minor
'@nocobase/app-plugin-authorization': minor
'@nocobase/app-plugin-authz-default-access': minor
'@nocobase/app-plugin-authz-restriction-rules': minor
'@nocobase/app-plugin-authz-sharing-rules': minor
'@nocobase/app-plugin-database-explorer': minor
'@nocobase/app-plugin-mail': minor
'@nocobase/app-plugin-notification': minor
'@nocobase/app-plugin-notification-in-app': minor
'@nocobase/app-plugin-scheduler': minor
'@nocobase/app-plugin-users': minor
'@nocobase/app-plugin-workflow': minor
---

Plugins no longer contribute Settings or Dev pages. Every page a plugin registered under `/settings/...` or `/dev/...` is removed, together with the components, locale keys and tests only those pages used; an application that wants such a page builds it on the plugin's HTTP API and client and declares it among its own routes.

- `@nocobase/app-plugin-api-keys`: the API keys page, `createApiKeysRoutes`, `normalizeApiKeysRoutePath`, `API_KEYS_PAGE_ACCESS`, `API_KEYS_ROUTE_ID` and the `./client/routes` entry are removed. The client factory takes no options, so call `apiKeys()`.
- `@nocobase/app-plugin-authorization`: the Permission Sets and Permission Inspector pages, the `./client/routes` entry and the `./client/management` entry the rule plugins built their pages from are removed. `useCan`, `AuthorizationClient`, the provider and the HTTP API are unchanged.
- `@nocobase/app-plugin-authz-default-access`, `@nocobase/app-plugin-authz-restriction-rules`, `@nocobase/app-plugin-authz-sharing-rules`: the rule pages and the `./client/routes` entry are removed. The client registers only the locale for the title its server registers.
- `@nocobase/app-plugin-database-explorer`: the explorer page and the `./client/routes` entry are removed. `DatabaseExplorerClient` and `DATABASE_EXPLORER_ACCESS` remain.
- `@nocobase/app-plugin-mail`: the account overview page and every Dev page are removed, along with the browser acceptance suite that drove them. `MailWorkspacePage` and `MailAccountsPage` remain; `MailWorkspacePage` takes an `accountsHref` that names the application's accounts page, and its empty state links there only when it is given. `mail.oauthReturnUrl` now defaults to the application root instead of `/dev/mail/accounts`; set it to the page that renders `MailAccountsPage`.
- `@nocobase/app-plugin-notification`: the notification logs page and the `./client/routes` entry are removed; the `logs-ui` registry item is unchanged.
- `@nocobase/app-plugin-notification-in-app`: the Dev inbox page, the `routes` export and the `./client/routes` entry are removed. Render `NotificationInAppInbox` inside `NotificationInAppProvider` in an application page.
- `@nocobase/app-plugin-scheduler`: the schedule list and detail pages are removed. The client registers only the locales for the titles its server registers.
- `@nocobase/app-plugin-users`: the user management page and the `mount`, `path`, `title` and `componentLoader` options are removed, together with `createUsersRoutes`, `USERS_PAGE_ACCESS` and `USERS_ROUTE_ID`. The plugin contributes only the invitation page at `/invite/:token`, which `inviteComponentLoader` still replaces; build a user management page on `UsersClient`.
- `@nocobase/app-plugin-workflow`: the workflow and workflow run pages, `WORKFLOW_SETTING_PATHS` and `WORKFLOW_ROUTE_IDS` are removed. The schedule target no longer returns an `href` for a workflow or a run, because there is no page to link to. The canvas, inspector and version comparison components remain.
