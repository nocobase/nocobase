# Run the minimal non-AI example

Use this example only in a new isolated demo application. It adds a fictional project and two assigned tasks, two visitor accounts, a protected task API and a reusable management page. An existing business application should adapt its own services instead of adding these example collections. No Agents registration is needed.

## 1. Copy the application additions

The maintained source is [assets/minimal-demo](../assets/minimal-demo/). Copy its `database/`, `server/` and `client/` additions into the corresponding application directories without replacing existing files. Follow the installed application Skill for package installation, registration, migrations and the development URL. The example is tested directly from these shipped files, not from a second implementation in documentation.

| Source                                                                                             | Purpose                                                           |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [Migration](../assets/minimal-demo/database/main/migrations/202610220001_example_demo_projects.ts) | Project and task collections; no framework table changes          |
| [Business adapter](../assets/minimal-demo/server/demo/business.ts)                                 | Concrete creation, visitor grants and dependent-first cleanup     |
| [Dataset](../assets/minimal-demo/server/demo/dataset.ts)                                           | Shared account definitions, relative dates and tracking           |
| [Provider](../assets/minimal-demo/server/providers/demo.ts)                                        | Register the dataset without generating it at startup             |
| [Task API](../assets/minimal-demo/server/routes/demo-projects.ts)                                  | Authentication, page permission and current-user record filtering |
| [Task component](../assets/minimal-demo/client/pages/demo-projects.tsx)                            | Render the signed-in visitor's tasks with the host API client     |

The example's cleanup deletes all rows in `demotasks` and `demoprojects`, including visitor additions. It owns no files, caches, external calls or jobs. Extend the cleanup inventory when adding those capabilities. The schema uses string identifiers so it does not assume the host's identity ID format.

## 2. Wire existing composition roots

Retain the application's Authentication, Authorization and Users plugins. Register Demo Mode with `pnpm nocobase plugin register demo-mode`, as described in [enable the deployment](../SKILL.md#enable-the-deployment). Add `DemoProvider` to `server/providers/index.ts` and `demoProjectRoutes` to `server/routes/index.ts`. Register the `demoMode` configuration section as described in [enable the deployment](../SKILL.md#enable-the-deployment).

Configure the isolated deployment:

```yaml
demoMode:
  enabled: true
```

The example assigns `demo.members` once through `createAccount.permissionSets`. The framework's default `app` role scope is optional; do not also assign that same Permission Set through `roleScopes.app`, which would duplicate its assignment. If an application requires a role scope, adapt `roleScopes` in `business.ts` and the account factory together so each Permission Set is assigned by exactly one mechanism. Use an existing real administrator to generate data.

Every page declares `authz`: a protected page without it is open only to unrestricted identities such as root, so visitors would be refused. Add the business page to the business routes in `client/routes.ts`, using page access:

```ts
{
  name: 'demoProjects',
  path: '/demo-projects',
  auth: 'required',
  authz: { resource: { type: 'page', id: 'demoProjects' }, action: 'access' },
  componentLoader: () => import('./pages/demo-projects.js'),
  navigation: { title: 'exampleDemo.title' },
},
```

Add the management page to the application's existing System management group, not as a top-level business entry. In the template that group is the `settings` route in `client/pages/settings/routes.ts`; register that contribution in `client/routes.ts` if the application has not yet done so. Build its demo children with the plugin's helper and spread `...demoManagementRoutes` into the existing group's `children`:

```ts
import { demoModeRoutes } from '@nocobase/app-plugin-demo-mode/client';

const demoManagementRoutes = demoModeRoutes([
  {
    name: 'settingsDemoMode',
    path: '/demo-mode',
    auth: 'required',
    authz: {
      resource: { type: 'settings', id: 'demoMode.data' },
      action: 'read',
    },
    navigation: { title: 'exampleDemo.management' },
    breadcrumb: { title: 'exampleDemo.management' },
    componentLoader: () => import('./demo-mode.js'),
  },
]);
```

`defineDemoModeConfig()` publishes `demoMode.enabled` to the browser. `demoModeRoutes()` includes these routes only when that flag is `true`, so ordinary deployments have neither the menu nor a directly accessible management route, even for root. Existing applications must wrap their own demo route declarations with this helper; registering the plugin alone cannot change application-owned menus. Verify both enabled and disabled deployments after integration.

The generated visitor Permission Set grants `page:demoProjects/access`. Keep normal business-page authorization enabled. Give the administrator `settings:demoMode.data/read,manage` and `settings:demoMode.configuration/read,configure` through the host's authorization mechanism. Do not add a page grant for the management route: it uses settings authorization. Outside Demo Mode these settings items are not registered; see [management access](../SKILL.md#management-access). A reader with only the data read action can inspect data status but cannot generate, clear or reset.

Create `client/pages/settings/demo-mode.tsx` using the public component:

```tsx
import { DemoModeSettings } from '@nocobase/app-plugin-demo-mode/client/settings';

export default function DemoManagement() {
  return <DemoModeSettings />;
}
```

Wrap each top-level page in the application's existing `PageContainer`, following the installed frontend Skill. Add `exampleDemo` keys to each language the application supports; for example, English uses `title: 'My demo tasks'`, `management: 'Demo management'`, `loading: 'Loading…'`, `failed: 'Could not load tasks.'`, `pending: 'Pending'`, `completed: 'Completed'`. The fixture story itself starts with `en-US`; translate it only when the requested demo needs another language.

## 3. Generate and verify

1. Run the application's normal migrations/startup and open its printed application entry URL. Sign in as the initial administrator described in [confirm the dedicated deployment](../SKILL.md#confirm-the-dedicated-deployment) and open `/demo-mode` under System management.
2. Generate `en-US`. Expect one project, two tasks and two visitor accounts. Open `/demo-sign-in?as=demo_alex&redirect=/demo-projects`: Alex sees “Review the first issue”. Sam sees “Prepare the next issue”. The server filters by assignee even if the caller changes the URL.
3. Reset as the administrator. Expect one project and two tasks again, with no duplicates; an existing visitor session remains valid. Clear, then generate again to exercise account disable/reuse separately.
4. For a writable demo, add an authorized business mutation through the application's normal API workflow, enable only its collection, create visitor content and verify reset removes it. The minimal example intentionally exposes only reading.

Alternatively use `pnpm nocobase demo-mode data import --actor <existing-admin-id> --language en-US --dry-run`, then replace `--dry-run` with `--force` after reviewing the target deployment. `--actor` takes the administrator's user ID, the `id` of its row in the `user` table, not its username. Dry-run prints the requested operation without starting or validating the application. Prefer the management page when the ID is not already known.

Only after this path works, read [write policies](policies.md) for exceptions/scheduling or [simulation](simulation.md) for AI. Keep those integrations out of a demo that does not need them.

## Troubleshooting

Use the failing step to choose the next check; do not bypass permissions or add unrelated infrastructure to make the example run.

| Symptom                                     | Check                                                                                                                                                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Management says demo mode is off            | Register `defineDemoModeConfig()` in the existing defaults map, set this deployment's `demoMode.enabled`, and restart. Installing or registering the Server plugin alone does not enable it.                         |
| Status says no dataset is available         | Register `DemoProvider` in the application provider list and verify it reaches the original `demoDataToken`. Generation is an explicit action after registration.                                                    |
| The CLI command is missing                  | Register `@nocobase/app-plugin-demo-mode/cli` in the CLI composition root; Server registration does not register commands.                                                                                           |
| The visitor entry is empty or sign-in fails | Complete generation, enable password sign-in and `quickSignIn`, and use the same explicit passwords in `accounts()` and `createAccount()`. Inspect the generation failure before retrying.                           |
| A page or management API returns 403        | Check that each client route declares `authz`, business-page access for visitor pages and settings actions for management, including the route's read check. Grant the settings actions only in the demo deployment. |
| A seed fails with `Unknown settings item`   | The `demoMode.*` settings items exist only while Demo Mode is enabled. Move those grants out of shared seeds; see [management access](../SKILL.md#management-access).                                                |
| Generated records do not appear on the page | Check the current account, assignee/owner filters, relationships and date ranges against the dataset; verify the page calls the intended business API.                                                               |
| Generation fails with an identity conflict  | Check the username and email in the account definitions; do not adopt an unrelated account. See [failure handling](adapting-data.md#business-cleanup).                                                               |
| Startup reports an unguarded connection     | Check each connection under `database.connections`; Demo Mode refuses to start when its probe write reaches a database. Do not remove the connection check to start.                                                 |
| The daily reset never runs                  | Compose `JobExecutorServiceProvider` in the application, generate the data once and check the saved schedule and its time zone on the management page.                                                               |

Report the application's real entry URL and checks performed, distinguishing browser validation from automated server checks.
