import { createOperationKey } from '@nocobase/api-client';
import { deriveSubmissionKey } from '@nocobase/app-client';
import { createUuid } from '@nocobase/app-client';
import type { ApiClient, RemoteRepository } from '@nocobase/app-client';
import type { RemoteSelectAst } from '@nocobase/api-client';

export const relationRepositories = {
  users: 'repositoryExampleRelationUsers',
  profiles: 'repositoryExampleRelationProjectProfiles',
  tasks: 'repositoryExampleRelationTasks',
  tags: 'repositoryExampleRelationTags',
  projectTags: 'repositoryExampleRelationProjectTags',
  projects: 'repositoryExampleRelationProjects',
} as const;

export interface RelationUser {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
}

export interface RelationProfile {
  readonly id: string;
  readonly summary: string;
  readonly projectId: string | null;
}

export interface RelationTask {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly points: number;
  readonly projectId: string | null;
  readonly assignee?: RelationUser | null;
}

export interface RelationTag {
  readonly id: string;
  readonly label: string;
}

export interface RelationProjectTag {
  readonly projectId: string;
  readonly tagId: string;
  readonly role: string | null;
}

export interface RelationProject {
  readonly id: string;
  readonly name: string;
  readonly status: string;
  readonly ownerId: string | null;
  readonly owner?: RelationUser | null;
  readonly profile?: RelationProfile | null;
  readonly tasks?: readonly RelationTask[];
  readonly tags?: readonly RelationTag[];
}

type RelationMutationValues = Record<string, unknown>;

export interface RelationProjectState {
  readonly project: RelationProject | undefined;
  readonly through: readonly RelationProjectTag[];
}

export interface RelationMutationCall {
  readonly repository: string;
  readonly action: 'createOne' | 'updateOne';
  readonly options: unknown;
  readonly result: unknown;
}

export interface RelationMutationScenario {
  readonly projectId: string;
  readonly state: RelationProjectState;
  readonly disconnectedTaskExists: boolean;
  readonly disconnectedTaskProjectId: string | null | undefined;
  readonly deletedTaskExists: boolean;
  readonly disconnectedTagExists: boolean;
  readonly calls: readonly RelationMutationCall[];
}

export const relationProjectSelect: RemoteSelectAst = {
  kind: 'select',
  version: 1,
  root: {
    kind: 'selection',
    fields: ['id', 'name', 'status', 'ownerId'],
    includes: [
      {
        kind: 'include',
        relation: 'owner',
        select: { kind: 'selection', fields: ['id', 'name', 'email'] },
      },
      {
        kind: 'include',
        relation: 'profile',
        select: {
          kind: 'selection',
          fields: ['id', 'summary', 'projectId'],
        },
      },
      {
        kind: 'include',
        relation: 'tasks',
        select: {
          kind: 'selection',
          fields: ['id', 'title', 'status', 'points', 'projectId'],
          includes: [
            {
              kind: 'include',
              relation: 'assignee',
              select: { kind: 'selection', fields: ['id', 'name'] },
            },
          ],
        },
      },
      {
        kind: 'include',
        relation: 'tags',
        select: { kind: 'selection', fields: ['id', 'label'] },
      },
    ],
  },
};

function projectRepository(
  api: ApiClient,
): RemoteRepository<
  RelationProject,
  RelationMutationValues,
  RelationMutationValues
> {
  return api.repository<
    RelationProject,
    RelationMutationValues,
    RelationMutationValues
  >(relationRepositories.projects);
}

export async function loadRelationProjectState(
  api: ApiClient,
  projectId: string,
): Promise<RelationProjectState> {
  const [project, through] = await Promise.all([
    projectRepository(api).findOne({
      filter: { id: projectId },
      select: relationProjectSelect,
    }),
    api
      .repository<RelationProjectTag>(relationRepositories.projectTags)
      .findMany({
        filter: { projectId },
        sort: {
          kind: 'sort',
          version: 1,
          items: [{ kind: 'field', path: ['tagId'], direction: 'asc' }],
        },
      }),
  ]);
  return { project, through };
}

export async function runRelationMutationScenario(
  api: ApiClient,
  requestedRunId: string = createUuid(),
  operationKey: string = createOperationKey(),
): Promise<RelationMutationScenario> {
  const runId = requestedRunId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36);
  if (!runId) throw new Error('A relation mutation run ID is required.');

  const ids = {
    project: `relation-project-${runId}`,
    profile: `relation-profile-${runId}`,
    connect: `relation-connect-${runId}`,
    edit: `relation-edit-${runId}`,
    detach: `relation-detach-${runId}`,
    obsolete: `relation-obsolete-${runId}`,
    created: `relation-created-${runId}`,
    imported: `relation-imported-${runId}`,
    tag: `relation-tag-${runId}`,
  };
  const calls: RelationMutationCall[] = [];
  const tasks = api.repository<RelationTask, RelationMutationValues>(
    relationRepositories.tasks,
  );
  const projects = projectRepository(api);

  const connectTaskInput = {
    values: {
      id: ids.connect,
      title: 'Existing task connected during update',
      status: 'draft',
      assignee: { connect: { id: 'user-1' } },
    },
  };
  const connectTaskResult = await tasks.createOne({
    ...connectTaskInput,
    idempotencyKey: deriveSubmissionKey(operationKey, 'prepare'),
  });
  calls.push({
    repository: relationRepositories.tasks,
    action: 'createOne',
    options: connectTaskInput,
    result: connectTaskResult,
  });

  const createInput = {
    values: {
      id: ids.project,
      name: `Relation mutation ${runId.slice(0, 8)}`,
      status: 'draft',
      owner: { connect: { id: 'user-1' } },
      profile: {
        create: {
          id: ids.profile,
          summary: 'Profile created with the project',
        },
      },
      tasks: {
        create: [
          {
            id: ids.edit,
            title: 'Task to update',
            status: 'draft',
            points: 1,
            assignee: { connect: { id: 'user-1' } },
          },
          {
            id: ids.detach,
            title: 'Task to disconnect',
            status: 'draft',
          },
          {
            id: ids.obsolete,
            title: 'Task to delete',
            status: 'draft',
          },
        ],
      },
      tags: {
        connect: {
          where: { id: 'tag-docs' },
          through: { role: 'secondary' },
        },
      },
    },
    select: relationProjectSelect,
  };
  const createResult = await projects.createOne({
    ...createInput,
    idempotencyKey: deriveSubmissionKey(operationKey, 'mutate'),
  });
  calls.push({
    repository: relationRepositories.projects,
    action: 'createOne',
    options: createInput,
    result: createResult,
  });

  const updateInput = {
    filter: { id: ids.project },
    values: {
      owner: { connect: { id: 'user-2' } },
      profile: {
        update: { values: { summary: 'Profile updated in place' } },
      },
      tasks: {
        create: {
          id: ids.created,
          title: 'Task created during update',
          status: 'active',
        },
        connect: { id: ids.connect },
        disconnect: { id: ids.detach },
        update: {
          filter: { id: ids.edit },
          values: {
            title: 'Task updated in relation scope',
            points: { increment: 2 },
          },
        },
        upsert: {
          filter: { id: ids.imported },
          create: {
            id: ids.imported,
            title: 'Task created by relation upsert',
            status: 'active',
          },
          update: { title: 'Task updated by relation upsert' },
        },
        delete: { filter: { id: ids.obsolete } },
      },
      tags: {
        connect: {
          where: { id: 'tag-db' },
          through: { role: 'primary' },
        },
        create: {
          values: { id: ids.tag, label: `Scenario tag ${runId}` },
          through: { role: 'temporary' },
        },
      },
    },
    select: relationProjectSelect,
  };
  const updateResult = await projects.updateOne({
    ...updateInput,
    idempotencyKey: deriveSubmissionKey(operationKey, 'attach'),
  });
  calls.push({
    repository: relationRepositories.projects,
    action: 'updateOne',
    options: updateInput,
    result: updateResult,
  });

  const setInput = {
    filter: { id: ids.project },
    values: {
      tags: {
        set: [
          { where: { id: 'tag-db' }, through: { role: 'primary' } },
          { id: 'tag-docs' },
        ],
      },
    },
    select: relationProjectSelect,
  };
  const setResult = await projects.updateOne({
    ...setInput,
    idempotencyKey: deriveSubmissionKey(operationKey, 'delete'),
  });
  calls.push({
    repository: relationRepositories.projects,
    action: 'updateOne',
    options: setInput,
    result: setResult,
  });

  const [state, disconnectedTask, deletedTask, disconnectedTag] =
    await Promise.all([
      loadRelationProjectState(api, ids.project),
      tasks.findOne({ filter: { id: ids.detach } }),
      tasks.findOne({ filter: { id: ids.obsolete } }),
      api
        .repository<RelationTag>(relationRepositories.tags)
        .findOne({ filter: { id: ids.tag } }),
    ]);

  return {
    projectId: ids.project,
    state,
    disconnectedTaskExists: Boolean(disconnectedTask),
    disconnectedTaskProjectId: disconnectedTask?.projectId,
    deletedTaskExists: Boolean(deletedTask),
    disconnectedTagExists: Boolean(disconnectedTag),
    calls,
  };
}
