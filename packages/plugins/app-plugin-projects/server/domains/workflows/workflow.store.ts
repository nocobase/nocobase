/**
 * `pmWorkflows`, and the reads across projects and issues that changing a workflow needs.
 */
import { RepositoryError, type DatabaseConnection } from '@nocobase/db';

import type {
  Workflow,
  WorkflowDefinition,
} from '../../../shared/workflows.js';
import { oneOf } from '../../kernel/db.js';

export const WORKFLOWS = 'pmWorkflows';
const PROJECTS = 'pmProjects';
const ISSUES = 'pmIssues';

interface WorkflowRecord {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isDefault: boolean | number;
  readonly builtInKey: string | null;
  readonly definition: WorkflowDefinition | string;
  readonly revision: number;
  readonly createdAt: Date | string;
  readonly updatedAt: Date | string;
}

const workflows = (conn: DatabaseConnection) =>
  conn.repository<WorkflowRecord>(WORKFLOWS);

const iso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

function toWorkflow(row: WorkflowRecord): Workflow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isDefault: Boolean(row.isDefault),
    builtInKey: row.builtInKey,
    definition:
      typeof row.definition === 'string'
        ? (JSON.parse(row.definition) as WorkflowDefinition)
        : row.definition,
    revision: Number(row.revision),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export async function listWorkflows(
  conn: DatabaseConnection,
): Promise<Workflow[]> {
  const rows = await workflows(conn).findMany({
    sort: (sort) => [sort.field('isDefault').desc(), sort.field('name').asc()],
  });
  return rows.map(toWorkflow);
}

export async function findWorkflow(
  conn: DatabaseConnection,
  id: string,
): Promise<Workflow | undefined> {
  const row = await workflows(conn).findOne({ filter: { id } });
  return row ? toWorkflow(row) : undefined;
}

export async function findDefaultWorkflow(
  conn: DatabaseConnection,
): Promise<Workflow | undefined> {
  const [row] = await workflows(conn).findMany({
    filter: { isDefault: true },
    sort: (sort) => sort.field('createdAt').asc(),
    limit: 1,
  });
  return row ? toWorkflow(row) : undefined;
}

export async function findBuiltInWorkflow(
  conn: DatabaseConnection,
  builtInKey: string,
): Promise<Workflow | undefined> {
  const row = await workflows(conn).findOne({ filter: { builtInKey } });
  return row ? toWorkflow(row) : undefined;
}

export async function insertWorkflow(
  conn: DatabaseConnection,
  workflow: Pick<Workflow, 'id' | 'name' | 'description' | 'definition'> & {
    readonly builtInKey?: string;
  },
): Promise<void> {
  const now = new Date();
  await workflows(conn).createOne({
    values: {
      ...workflow,
      isDefault: false,
      builtInKey: workflow.builtInKey ?? null,
      createdAt: now,
      updatedAt: now,
    },
  });
}

/** Writes when the row is still at `revision` (the revision then moves on); false when it moved meanwhile. */
export async function updateWorkflow(
  conn: DatabaseConnection,
  id: string,
  revision: number,
  values: Partial<Pick<Workflow, 'name' | 'description' | 'definition'>>,
): Promise<boolean> {
  try {
    await workflows(conn).updateOne({
      filter: { id },
      ifVersion: revision,
      values: { ...values, updatedAt: new Date() },
    });
    return true;
  } catch (error) {
    if (error instanceof RepositoryError && error.code === 'VERSION_CONFLICT')
      return false;
    throw error;
  }
}

export async function setDefaultWorkflow(
  conn: DatabaseConnection,
  id: string,
): Promise<void> {
  await workflows(conn).updateMany({
    filter: { isDefault: true },
    values: { isDefault: false, updatedAt: new Date() },
  });
  await workflows(conn).updateOne({
    filter: { id },
    values: { isDefault: true, updatedAt: new Date() },
  });
}

export async function deleteWorkflow(
  conn: DatabaseConnection,
  id: string,
): Promise<void> {
  await workflows(conn).deleteOne({ filter: { id } });
}

/** The workflow a project chose; null for the default, undefined when the project does not exist. */
export async function workflowIdOfProject(
  conn: DatabaseConnection,
  projectId: string,
): Promise<string | null | undefined> {
  const row = await conn
    .repository<{ id: string; workflowId: string | null }>(PROJECTS)
    .findOne({
      filter: { id: projectId },
      select: (select) => select.fields('workflowId'),
    });
  return row ? row.workflowId : undefined;
}

/** Projects per workflow id; the key null counts projects on the default. */
export async function projectCounts(
  conn: DatabaseConnection,
): Promise<Map<string | null, number>> {
  const groups = await conn
    .repository<{ workflowId: string | null }>(PROJECTS)
    .groupBy({
      by: ['workflowId'],
      aggregate: (aggregate) => ({ count: aggregate.count() }),
    });
  return new Map(
    groups.map((group) => [
      group.workflowId === null || group.workflowId === undefined
        ? null
        : String(group.workflowId),
      Number(group.count),
    ]),
  );
}

/** The projects on a workflow (`null`: on the default, choosing none), with their names. */
export async function projectsOnWorkflow(
  conn: DatabaseConnection,
  workflowId: string | null,
): Promise<{ id: string; name: string }[]> {
  return conn
    .repository<{ id: string; name: string; workflowId: string | null }>(
      PROJECTS,
    )
    .findMany({
      filter: (f) => f.string('workflowId').eq(workflowId),
      select: (select) => select.fields('id', 'name'),
    });
}

/** Issues (not deleted) per project and status, among `projectIds`; `includeLoose` adds issues without a project. */
export async function issueStatusCounts(
  conn: DatabaseConnection,
  projectIds: readonly string[],
  includeLoose: boolean,
): Promise<{ projectId: string | null; statusKey: string; count: number }[]> {
  if (projectIds.length === 0 && !includeLoose) return [];
  const groups = await conn
    .repository<{
      projectId: string | null;
      statusKey: string;
      deletedAt: string | null;
    }>(ISSUES)
    .groupBy({
      by: ['projectId', 'statusKey'],
      aggregate: (aggregate) => ({ count: aggregate.count() }),
      filter: (f) =>
        f.and([
          f.date('deletedAt').empty(),
          f.or([
            oneOf(f, 'projectId', projectIds),
            ...(includeLoose ? [f.string('projectId').eq(null)] : []),
          ]),
        ]),
    });
  return groups.map((group) => ({
    projectId:
      group.projectId === null || group.projectId === undefined
        ? null
        : String(group.projectId),
    statusKey: String(group.statusKey),
    count: Number(group.count),
  }));
}
