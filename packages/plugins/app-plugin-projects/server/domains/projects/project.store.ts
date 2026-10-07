/**
 * The project collections: `pmProjects`, and its `pmProjectMembers` and `pmProjectResources`, which are deleted with
 * their project.
 */
import type { DatabaseConnection, RepositoryFilter } from '@nocobase/db';

import type { Priority, UserRef } from '../../../shared/common.js';
import type {
  Project,
  ProjectResource,
  ProjectStatus,
  ProjectVisibility,
} from '../../../shared/projects.js';
import { oneOf } from '../../kernel/db.js';

export const PROJECTS = 'pmProjects';
const MEMBERS = 'pmProjectMembers';
const RESOURCES = 'pmProjectResources';

export interface ProjectRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly visibility: ProjectVisibility;
  readonly status: ProjectStatus;
  readonly priority: Priority;
  readonly leadUserId: string | null;
  readonly startDate: string | null;
  readonly dueDate: string | null;
  readonly workflowId: string | null;
  readonly setupIssueId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface MemberRecord {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly createdAt: string;
}

interface ResourceRecord extends Omit<ProjectResource, 'binding'> {
  readonly bindingProvider: string | null;
  readonly bindingConnectionId: string | null;
  readonly bindingRepoId: string | null;
  readonly bindingFullName: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** The binding as its columns. */
function bindingColumns(
  binding: ProjectResource['binding'],
): Pick<
  ResourceRecord,
  | 'bindingProvider'
  | 'bindingConnectionId'
  | 'bindingRepoId'
  | 'bindingFullName'
> {
  return {
    bindingProvider: binding?.provider ?? null,
    bindingConnectionId: binding?.connectionId ?? null,
    bindingRepoId: binding?.repoId ?? null,
    bindingFullName: binding?.fullName ?? null,
  };
}

function resourceOf(
  record: Pick<ResourceRecord, (typeof RESOURCE_FIELDS)[number]>,
): ProjectResource {
  const {
    bindingProvider,
    bindingConnectionId,
    bindingRepoId,
    bindingFullName,
    ...rest
  } = record;
  return {
    ...rest,
    binding:
      bindingProvider && bindingConnectionId && bindingRepoId && bindingFullName
        ? {
            provider: bindingProvider,
            connectionId: bindingConnectionId,
            repoId: bindingRepoId,
            fullName: bindingFullName,
          }
        : null,
  };
}

interface Named {
  readonly name: string | null;
  readonly username: string | null;
  readonly email: string | null;
}

export type ProjectValues = Partial<
  Omit<ProjectRecord, 'id' | 'createdAt' | 'updatedAt'>
>;

const projects = (conn: DatabaseConnection) =>
  conn.repository<ProjectRecord>(PROJECTS);
const members = (conn: DatabaseConnection) =>
  conn.repository<MemberRecord>(MEMBERS);
const resources = (conn: DatabaseConnection) =>
  conn.repository<ResourceRecord>(RESOURCES);

const PROJECT_FIELDS = [
  'id',
  'name',
  'description',
  'visibility',
  'status',
  'priority',
  'leadUserId',
  'startDate',
  'dueDate',
  'workflowId',
  'setupIssueId',
  'createdAt',
  'updatedAt',
] as const;

const RESOURCE_FIELDS = [
  'id',
  'projectId',
  'type',
  'url',
  'defaultRef',
  'runnerId',
  'path',
  'label',
  'initPrompt',
  'position',
  'bindingProvider',
  'bindingConnectionId',
  'bindingRepoId',
  'bindingFullName',
] as const;

function displayName(user: Named | null | undefined, id: string): string {
  return user?.name || user?.username || user?.email || id;
}

/** A project with its lead's name. */
export interface ProjectWithLead extends Project {
  readonly lead: UserRef | null;
}

function withLead(
  row: ProjectRecord & { lead?: Named | null },
): ProjectWithLead {
  const { lead, ...project } = row;
  return {
    ...project,
    lead: project.leadUserId
      ? { id: project.leadUserId, name: displayName(lead, project.leadUserId) }
      : null,
  };
}

export async function findProjects(
  conn: DatabaseConnection,
  filter?: RepositoryFilter<ProjectRecord>,
): Promise<ProjectWithLead[]> {
  const rows = await projects(conn).findMany({
    ...(filter ? { filter } : {}),
    select: (select) =>
      select
        .fields(...PROJECT_FIELDS)
        .include('lead', (lead) => lead.fields('name', 'username', 'email')),
    sort: (sort) => [sort.field('name').asc(), sort.field('id').asc()],
  });
  return rows.map((row) =>
    withLead(row as ProjectRecord & { lead?: Named | null }),
  );
}

export async function findProject(
  conn: DatabaseConnection,
  id: string,
): Promise<ProjectWithLead | undefined> {
  const [project] = await findProjects(conn, { id });
  return project;
}

export async function insertProject(
  conn: DatabaseConnection,
  id: string,
  values: ProjectValues & Pick<ProjectRecord, 'name'>,
): Promise<void> {
  const now = new Date().toISOString();
  await projects(conn).createOne({
    values: { ...values, id, createdAt: now, updatedAt: now },
  });
}

export async function updateProject(
  conn: DatabaseConnection,
  id: string,
  values: ProjectValues,
): Promise<void> {
  await projects(conn).updateOne({
    filter: { id },
    values: { ...values, updatedAt: new Date().toISOString() },
  });
}

/** Deletes the project with its members and resources. */
export async function deleteProject(
  conn: DatabaseConnection,
  id: string,
): Promise<void> {
  await projects(conn).deleteOne({ filter: { id } });
}

export async function memberCounts(
  conn: DatabaseConnection,
  projectIds: readonly string[],
): Promise<Map<string, number>> {
  if (projectIds.length === 0) return new Map();
  const groups = await members(conn).groupBy({
    by: ['projectId'],
    aggregate: (aggregate) => ({ count: aggregate.count() }),
    filter: (f) => oneOf(f, 'projectId', projectIds),
  });
  return new Map(
    groups.map((group) => [String(group.projectId), Number(group.count)]),
  );
}

export async function listMembers(
  conn: DatabaseConnection,
  projectId: string,
): Promise<UserRef[]> {
  const rows = await members(conn).findMany({
    filter: { projectId },
    select: (select) =>
      select
        .fields('userId')
        .include('user', (user) => user.fields('name', 'username', 'email')),
    sort: (sort) => [sort.field('createdAt').asc(), sort.field('id').asc()],
  });
  return rows.map((row) => {
    const { userId, user } = row as { userId: string; user?: Named | null };
    return { id: userId, name: displayName(user, userId) };
  });
}

export function isMember(
  conn: DatabaseConnection,
  projectId: string,
  userId: string,
): Promise<boolean> {
  return members(conn).exists({ filter: { projectId, userId } });
}

/** Whether any of the users is a member of the project. */
export function hasMember(
  conn: DatabaseConnection,
  projectId: string,
  userIds: readonly string[],
): Promise<boolean> {
  if (userIds.length === 0) return Promise.resolve(false);
  return members(conn).exists({
    filter: (f) =>
      f.and([f.string('projectId').eq(projectId), oneOf(f, 'userId', userIds)]),
  });
}

/** Adds the user unless they are a member already; whether they were added. */
export async function addMember(
  conn: DatabaseConnection,
  id: string,
  projectId: string,
  userId: string,
): Promise<boolean> {
  if (await isMember(conn, projectId, userId)) return false;
  await members(conn).createOne({
    values: { id, projectId, userId, createdAt: new Date().toISOString() },
  });
  return true;
}

/** Project names by id; projects that no longer exist are left out. */
export async function projectNames(
  conn: DatabaseConnection,
  ids: readonly string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await projects(conn).findMany({
    filter: (f) => oneOf(f, 'id', ids),
    select: (select) => select.fields('id', 'name'),
  });
  return new Map(rows.map((row) => [row.id, row.name]));
}

export async function removeMember(
  conn: DatabaseConnection,
  projectId: string,
  userId: string,
): Promise<void> {
  await members(conn).deleteMany({ filter: { projectId, userId } });
}

export async function listResources(
  conn: DatabaseConnection,
  projectId: string,
): Promise<ProjectResource[]> {
  return (
    await resources(conn).findMany({
      filter: { projectId },
      select: (select) => select.fields(...RESOURCE_FIELDS),
      sort: (sort) => [
        sort.field('position').asc(),
        sort.field('createdAt').asc(),
      ],
    })
  ).map(resourceOf);
}

export async function findResource(
  conn: DatabaseConnection,
  projectId: string,
  id: string,
): Promise<ProjectResource | undefined> {
  const found = await resources(conn).findOne({
    filter: { projectId, id },
    select: (select) => select.fields(...RESOURCE_FIELDS),
  });
  return found ? resourceOf(found) : undefined;
}

export async function findResourceById(
  conn: DatabaseConnection,
  id: string,
): Promise<ProjectResource | undefined> {
  const found = await resources(conn).findOne({
    filter: { id },
    select: (select) => select.fields(...RESOURCE_FIELDS),
  });
  return found ? resourceOf(found) : undefined;
}

export async function insertResource(
  conn: DatabaseConnection,
  resource: ProjectResource,
): Promise<void> {
  const now = new Date().toISOString();
  const { binding, ...rest } = resource;
  await resources(conn).createOne({
    values: {
      ...rest,
      ...bindingColumns(binding),
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function updateResource(
  conn: DatabaseConnection,
  id: string,
  values: Partial<
    Pick<
      ProjectResource,
      | 'url'
      | 'defaultRef'
      | 'binding'
      | 'runnerId'
      | 'path'
      | 'label'
      | 'initPrompt'
      | 'position'
    >
  >,
): Promise<void> {
  const { binding, ...rest } = values;
  await resources(conn).updateOne({
    filter: { id },
    values: {
      ...rest,
      ...(binding === undefined ? {} : bindingColumns(binding)),
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function deleteResource(
  conn: DatabaseConnection,
  id: string,
): Promise<void> {
  await resources(conn).deleteOne({ filter: { id } });
}

/** The position after the project's last resource. */
export async function nextResourcePosition(
  conn: DatabaseConnection,
  projectId: string,
): Promise<number> {
  const [last] = await resources(conn).findMany({
    filter: { projectId },
    select: (select) => select.fields('position'),
    sort: (sort) => sort.field('position').desc(),
    limit: 1,
  });
  return last ? last.position + 1 : 0;
}
