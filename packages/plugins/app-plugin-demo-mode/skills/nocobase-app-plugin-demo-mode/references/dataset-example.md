# A minimal dataset adapter

This is a typed application adapter pattern, not a built-in project/task schema. Implement the three business methods against the application's existing services and collections, and supply grants from its authorization declarations. The example introduces no plugin-private imports, database tables or network calls. Start with one language; add languages only when the requested demo needs them.

Use one account list for both `accounts()` and `createAccount()`. Set explicit passwords that meet the installed authentication policy; do not rely on the username-derived default for short usernames. Every listed account is publicly enterable when quick sign-in is enabled. Keep management access on the real administrator, separate from visitor roles.

```ts
import type {
  DemoDataset,
  DemoPermissionSetSpec,
} from '@nocobase/app-plugin-demo-mode/server/tokens';

interface DemoBusiness {
  // These are application-owned service contracts; use the actual collection
  // names and role-scope values of the installing application.
  projectCollection: string;
  taskCollection: string;
  createProject(input: {
    title: string;
    ownerId: string;
    createdAt: Date;
  }): Promise<string>;
  createTask(input: {
    projectId: string;
    title: string;
    assigneeId: string;
    state: 'pending' | 'completed';
    createdAt: Date;
  }): Promise<string>;
  clearBusinessData(): Promise<void>;
  visitorGrants: DemoPermissionSetSpec['grants'];
  roleScopes?: Readonly<Record<string, string | readonly string[]>>;
}

const people = [
  {
    username: 'demo_alex',
    name: 'Alex',
    email: 'alex@example.com',
    password: 'DemoAlex123!',
    role: 'Project member',
  },
  {
    username: 'demo_sam',
    name: 'Sam',
    email: 'sam@example.com',
    password: 'DemoSam123!',
    role: 'Project member',
  },
] as const;

export function createDemoDataset(business: DemoBusiness): DemoDataset {
  return {
    id: 'project-demo',
    languages: ['en-US'],
    timeZone: () => 'UTC',
    accounts: () => people.map(({ email: _email, ...account }) => account),
    async generate(context) {
      await context.createPermissionSet({
        key: 'demo.members',
        title: 'Demo members',
        grants: business.visitorGrants,
      });
      const userIds: string[] = [];
      for (const { role: _role, ...person } of people) {
        userIds.push(
          await context.createAccount({
            ...person,
            permissionSets: ['demo.members'],
            roleScopes: business.roleScopes,
          }),
        );
      }
      await context.progress(0.2);
      const projectId = await business.createProject({
        title: 'Launch the community newsletter',
        ownerId: userIds[0]!,
        createdAt: context.clock.daysAgo(7),
      });
      await context.track(business.projectCollection, projectId);
      const tasks = [
        { title: 'Review the first issue', state: 'completed' as const },
        { title: 'Prepare the next issue', state: 'pending' as const },
      ];
      for (const [index, task] of tasks.entries()) {
        const days =
          task.state === 'completed'
            ? 2 + Math.floor(context.clock.sample('review-age') * 3)
            : 1;
        const id = await business.createTask({
          ...task,
          projectId,
          assigneeId: userIds[index]!,
          createdAt: context.clock.daysAgo(days),
        });
        await context.track(business.taskCollection, id);
        await context.progress(0.5 + (index + 1) * 0.25);
      }
    },
    async clear(context) {
      await business.clearBusinessData();
      await context.progress(1);
    },
  };
}
```

Register the result from an application provider after its business services exist. Import the original `demoDataToken` from `@nocobase/app-plugin-demo-mode/server/tokens`, then call `this.app.container.resolve(demoDataToken).register(createDemoDataset(business))`. Registration declares the dataset; it does not generate records. Follow the application's provider registration convention rather than adding a second runtime entry.

`clearBusinessData()` must stop or cancel active demo work and remove dependent records before parents, plus the associated files and caches. It clears all business data in the dedicated demo instance, including visitor additions and rows created before a failed tracking call. It must tolerate repeated calls and partially generated data. Preserve system identities, permissions and plugin infrastructure; the plugin handles its tracked accounts and Permission Sets. Do not replace this method with deletion of tracked IDs alone.

If real services create a pending task and then complete it through a lifecycle transition, adapt `createTask()` to that sequence; do not bypass validation to force the example's state field into the database. Likewise adapt role scopes and grants to the application's actual permissions. For a multilingual demo, derive both display accounts and generated content from the same language-specific factory.

For shared sample installation, extract the business generation into an application function whose arguments contain the people, clock and business services it needs. The ordinary sample entry supplies its own identity helpers; the demo entry adapts `DemoImportContext`. Do not require a sample installation to start the demo lifecycle merely to reuse fictional content.

## Run and verify

1. Set the dedicated deployment's demo mode and disable model provisioning when no AI feature is needed. Start the application with its normal migration and initialization workflow.
2. Mount `DemoModeSettings`, grant the real administrator data read/manage access, and choose Generate. Alternatively run `pnpm nocobase demo-mode data import --actor <administrator-id> --language en-US --dry-run`, then the same command with `--force` instead of `--dry-run`. Replace the actor placeholder with an existing administrator ID.
3. Check that generation completes, the project and both tasks appear with recent dates, and both visitor accounts can enter through `/demo-sign-in` and see the records allowed by their grants.
4. Enable only the visitor writes needed by this demo. Add one visitor task, reset, and verify the original story returns, the visitor task is gone and accounts remain reusable. Clear and generate once more to verify the separate account-disable/reuse path.
5. Report the application entry URL, visitor roles, permitted interactions and any unverified behavior. Add model/tool/Runner examples only if they are part of the requested demonstration.
