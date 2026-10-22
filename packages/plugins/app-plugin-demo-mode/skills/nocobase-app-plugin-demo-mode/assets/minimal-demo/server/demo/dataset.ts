import type {
  DemoDataset,
  DemoPermissionSetSpec,
} from '@nocobase/app-plugin-demo-mode/server/tokens';

export interface DemoBusiness {
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
        ownerId: userIds[0],
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
          assigneeId: userIds[index],
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
