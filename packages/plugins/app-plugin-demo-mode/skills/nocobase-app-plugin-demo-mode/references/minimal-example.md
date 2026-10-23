# Run the minimal non-AI example

Use this example only in a new isolated demo application. It adds a fictional project and two assigned tasks, two visitor accounts, a protected task API and a reusable management page. An existing business application should adapt its own services instead of adding these example collections. No Agents or Scheduler registration is needed.

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

Retain the application's Authentication, Authorization and Users plugins. Add Demo Mode's Server export, Client factory and CLI export through the normal application composition roots. Add `DemoProvider` to `server/providers/index.ts` and `demoProjectRoutes` to `server/routes/index.ts`. Register `defineDemoModeConfig()` under `demoMode` in the existing `defaultAppConfigs()` map.

Configure the isolated deployment:

```yaml
demoMode:
  enabled: true
  quickSignIn: true
  allowCollections: []
```

The example assigns `demo.members` once through `createAccount.permissionSets`. The framework's default `app` role scope is optional; do not also assign that same Permission Set through `roleScopes.app`, which would duplicate its assignment. If an application requires a role scope, adapt `roleScopes` in `business.ts` and the account factory together so each Permission Set is assigned by exactly one mechanism. Use an existing real administrator to generate data; neither visitor receives management grants.

Add authenticated routes in `client/routes.ts`. The business page uses page access; the management page checks its settings item:

```ts
{
  name: 'demoProjects',
  path: '/demo-projects',
  auth: 'required',
  componentLoader: () => import('./pages/demo-projects.js'),
  navigation: { title: 'exampleDemo.title' },
},
{
  name: 'demoManagement',
  path: '/demo-management',
  auth: 'required',
  authz: {
    resource: { type: 'settings', id: 'demoMode.data' },
    action: 'read',
  },
  componentLoader: () => import('./pages/demo-management.js'),
  navigation: { title: 'exampleDemo.management' },
},
```

The generated visitor Permission Set grants `page:demoProjects/access`. Keep normal business-page authorization enabled. Give the administrator `settings:demoMode.data/read,manage` and `settings:demoMode.configuration/read,configure` through the host's authorization mechanism. Do not add `page:demoManagement/access`: the management route uses settings authorization. A reader with only the data read action can inspect data status but cannot generate, clear or reset. Visitors receive no management settings actions.

Create `client/pages/demo-management.tsx` using the public component:

```tsx
import { DemoModeSettings } from '@nocobase/app-plugin-demo-mode/client/settings';

export default function DemoManagement() {
  return <DemoModeSettings />;
}
```

Wrap each top-level page in the application's existing `PageContainer`, following the installed frontend Skill. Add `exampleDemo` keys to each language the application supports; for example, English uses `title: 'My demo tasks'`, `management: 'Demo management'`, `loading: 'Loading…'`, `failed: 'Could not load tasks.'`, `pending: 'Pending'`, `completed: 'Completed'`. The fixture story itself starts with `en-US`; translate it only when the requested demo needs another language.

## 3. Generate and verify

1. Run the application's normal migrations/startup and open its printed application entry URL. Sign in as the real administrator and open `/demo-management`. This example does not require Scheduler, but an existing host registration still activates the default daily reset; [save a disabled schedule](policies.md#decide-the-reset-schedule-before-generation) before generating when recurring resets are not wanted.
2. Generate `en-US`. Expect one project, two tasks and two visitor accounts. Open `/demo-sign-in?as=demo_alex&redirect=/demo-projects`: Alex sees “Review the first issue”. Sam sees “Prepare the next issue”. The server filters by assignee even if the caller changes the URL.
3. Confirm a visitor cannot call `POST /api/demoMode/data/reset`; authenticated access alone is insufficient. Add the application's base path to API URLs.
4. Reset as the administrator. Expect one project and two tasks again, with no duplicates; an existing visitor session remains valid. Clear, then generate again to exercise account disable/reuse separately.
5. For a writable demo, add an authorized business mutation through the application's normal API workflow, enable only its collection, create visitor content and verify reset removes it. The minimal example intentionally exposes only reading.

Alternatively use `pnpm nocobase demo-mode data import --actor <existing-admin-id> --language en-US --dry-run`, then replace `--dry-run` with `--force` after reviewing the target deployment. Record the real application URL and the runtime checks performed. The package's automated example test exercises real authentication, Users, Authorization, generation, visitor entry, record filtering, denied visitor reset and account reuse; it does not replace browser validation in the consuming application.

Only after this path works, read [write policies](policies.md) for exceptions/scheduling or [simulation](simulation.md) for AI. Keep those integrations out of a demo that does not need them.

## Troubleshooting

Use the failing step to choose the next check; do not bypass permissions or add unrelated infrastructure to make the example run.

| Symptom                                     | Check                                                                                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Management says demo mode is off            | Register `defineDemoModeConfig()` in the existing defaults map, set this deployment's `demoMode.enabled`, and restart. Installing or registering the Server plugin alone does not enable it. |
| Status says no dataset is available         | Register `DemoProvider` in the application provider list and verify it reaches the original `demoDataToken`. Generation is an explicit action after registration.                            |
| The CLI command is missing                  | Register `@nocobase/app-plugin-demo-mode/cli` in the CLI composition root; Server registration does not register commands.                                                                   |
| The visitor entry is empty or sign-in fails | Complete generation, enable password sign-in and `quickSignIn`, and use the same explicit passwords in `accounts()` and `createAccount()`. Inspect the generation failure before retrying.   |
| A page or management API returns 403        | Check business-page access for visitor pages and settings actions for management, including the route's read check. Keep visitor grants separate from administrator grants.                  |
| Generated records do not appear on the page | Check the current account, assignee/owner filters, relationships and date ranges against the dataset; verify the page calls the intended business API.                                       |
| Demo content disappears overnight           | Inspect the saved reset policy and existing Scheduler registration. Omitting the schedule card does not disable its default 03:00 reset.                                                     |
| Generation fails with an identity conflict  | Follow [cleanup and recovery](adapting-data.md#coordinate-cleanup-and-recovery); verify ownership instead of adopting an existing account or repeatedly retrying.                            |

For API calls, use the application's printed entry URL and base path. For this example, a successful first delivery shows Alex's task and Sam's task under their respective accounts, denies visitor reset, and reproduces the same two-task story after reset. Report browser checks separately from automated server checks.
