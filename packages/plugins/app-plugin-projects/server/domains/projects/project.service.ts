/**
 * Projects: a group of issues with a lead, members, repositories and a visibility. The creator becomes a member and,
 * unless someone else is named, the lead; the lead is always a member. Deleting a project keeps its issues, detached.
 */
import type { DatabaseConnection } from '@nocobase/db';

import { PRIORITIES } from '../../../shared/common.js';
import {
  PROJECT_NAME_MAX,
  PROJECT_STATUSES,
  PROJECT_VISIBILITIES,
  type CreateProjectRequest,
  type IssueCounts,
  type ProjectDetail,
  type ProjectListItem,
  type UpdateProjectRequest,
} from '../../../shared/projects.js';
import { requireAction, scopeOf, type Viewer } from '../../access/viewer.js';
import type { Actor } from '../../kernel/actor.js';
import { conflict, forbidden, invalid, notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import type { UserDirectory } from '../../kernel/users.js';
import {
  optionalText,
  requiredText,
  validChoice,
  validDate,
} from '../../kernel/validate.js';
import {
  canManage,
  managed,
  requireVisible,
  visibleProjectsFilter,
} from './project.access.js';
import {
  createProjectMembers,
  type ProjectMembers,
} from './project-members.js';
import {
  createProjectResources,
  type ProjectResources,
} from './project-resources.js';
import {
  addMember,
  deleteProject,
  findProject,
  findProjects,
  insertProject,
  listMembers,
  listResources,
  memberCounts,
  updateProject,
  type ProjectValues,
  type ProjectWithLead,
} from './project.store.js';

/** What projects need to know about their issues, provided by the issues domain. */
export interface ProjectIssues {
  counts(
    conn: DatabaseConnection,
    projectIds: readonly string[],
  ): Promise<Map<string, IssueCounts>>;
  /** Detaches the project's issues, in the transaction that deletes it. */
  detach(tx: Tx, projectId: string, actor: Actor): Promise<void>;
}

export interface ProjectService extends ProjectMembers, ProjectResources {
  list(viewer: Viewer): Promise<ProjectListItem[]>;
  get(viewer: Viewer, id: string): Promise<ProjectDetail>;
  create(viewer: Viewer, input: CreateProjectRequest): Promise<ProjectDetail>;
  update(
    viewer: Viewer,
    id: string,
    patch: UpdateProjectRequest,
  ): Promise<ProjectDetail>;
  remove(viewer: Viewer, id: string): Promise<void>;
  /**
   * For undoing a plan: deletes a project the viewer leads (or any, for one who may delete projects) that has no live
   * issue left (400 `PROJECT_NOT_EMPTY` otherwise); its deleted issues are detached. Not offered over HTTP; the plans
   * domain checks that its plan created the project.
   */
  retract(viewer: Viewer, id: string): Promise<void>;
}

/** What projects need to know about workflows, provided by the workflows domain. */
export interface ProjectWorkflowChoice {
  requireExisting(conn: DatabaseConnection, id: string): Promise<void>;
  assertCompatible(
    conn: DatabaseConnection,
    projectId: string,
    workflowId: string | null,
  ): Promise<void>;
  switched(tx: Tx, workflowId: string | null): void;
}

export interface ProjectDeps {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  readonly users: UserDirectory;
  readonly issues: () => ProjectIssues;
  readonly workflows: () => ProjectWorkflowChoice;
}

const EMPTY_COUNTS: IssueCounts = { total: 0, done: 0, byStatus: {} };

/** Validated column values of a create or update request. */
async function valuesOf(
  deps: ProjectDeps,
  conn: DatabaseConnection,
  input: UpdateProjectRequest,
): Promise<ProjectValues> {
  const values: { -readonly [K in keyof ProjectValues]: ProjectValues[K] } = {};
  if (input.name !== undefined)
    values.name = requiredText(
      input.name,
      'name',
      PROJECT_NAME_MAX,
      'INVALID_NAME',
    );
  if (input.description !== undefined)
    values.description = optionalText(
      input.description,
      'description',
      100_000,
    );
  if (input.visibility !== undefined)
    values.visibility = validChoice(
      input.visibility,
      PROJECT_VISIBILITIES,
      'visibility',
    );
  if (input.status !== undefined)
    values.status = validChoice(input.status, PROJECT_STATUSES, 'status');
  if (input.priority !== undefined)
    values.priority = validChoice(input.priority, PRIORITIES, 'priority');
  if (input.startDate !== undefined)
    values.startDate = validDate(input.startDate, 'startDate');
  if (input.dueDate !== undefined)
    values.dueDate = validDate(input.dueDate, 'dueDate');
  if (input.leadUserId !== undefined) {
    if (
      input.leadUserId !== null &&
      (typeof input.leadUserId !== 'string' ||
        !(await deps.users.isPerson(conn, input.leadUserId)))
    )
      throw invalid('INVALID_LEAD', 'leadUserId is not an active user.');
    values.leadUserId = input.leadUserId;
  }
  if (input.workflowId !== undefined) {
    if (input.workflowId !== null) {
      if (typeof input.workflowId !== 'string')
        throw invalid('INVALID_WORKFLOW', 'workflowId names no workflow.');
      await deps.workflows().requireExisting(conn, input.workflowId);
    }
    values.workflowId = input.workflowId;
  }
  return values;
}

async function listItems(
  deps: ProjectDeps,
  conn: DatabaseConnection,
  projects: readonly ProjectWithLead[],
): Promise<ProjectListItem[]> {
  const ids = projects.map((project) => project.id);
  const [members, counts] = await Promise.all([
    memberCounts(conn, ids),
    deps.issues().counts(conn, ids),
  ]);
  return projects.map((project) => ({
    ...project,
    memberCount: members.get(project.id) ?? 0,
    issueCounts: counts.get(project.id) ?? EMPTY_COUNTS,
  }));
}

async function detail(
  deps: ProjectDeps,
  conn: DatabaseConnection,
  id: string,
): Promise<ProjectDetail> {
  const project = await findProject(conn, id);
  if (!project) throw notFound('Project');
  const [item] = await listItems(deps, conn, [project]);
  return {
    ...item,
    members: await listMembers(conn, id),
    resources: await listResources(conn, id),
  };
}

export function createProjectService(deps: ProjectDeps): ProjectService {
  return {
    ...createProjectMembers(deps),
    ...createProjectResources(deps),

    async list(viewer) {
      const conn = deps.tx.read();
      const projects = await findProjects(conn, visibleProjectsFilter(viewer));
      return listItems(deps, conn, projects);
    },

    async get(viewer, id) {
      const conn = deps.tx.read();
      await requireVisible(conn, viewer, id);
      return detail(deps, conn, id);
    },

    async create(viewer, input) {
      requireAction(
        viewer,
        'pm.projects',
        'create',
        'You may not create projects.',
      );
      const id = deps.ids.next();
      await deps.tx.run(async (tx) => {
        const values = await valuesOf(deps, tx.conn, input);
        // An organization's API key (a service account) that creates a project neither leads nor joins it.
        const person = await deps.users.isPerson(tx.conn, viewer.userId);
        const leadUserId =
          values.leadUserId === undefined
            ? person
              ? viewer.userId
              : null
            : values.leadUserId;
        await insertProject(tx.conn, id, {
          ...values,
          name: requiredText(
            input.name,
            'name',
            PROJECT_NAME_MAX,
            'INVALID_NAME',
          ),
          leadUserId,
        });
        if (person)
          await addMember(tx.conn, deps.ids.next(), id, viewer.userId);
        if (leadUserId && leadUserId !== viewer.userId)
          await addMember(tx.conn, deps.ids.next(), id, leadUserId);
      });
      return detail(deps, deps.tx.read(), id);
    },

    async update(viewer, id, patch) {
      await managed(deps.tx, viewer, id, async (tx) => {
        const values = await valuesOf(deps, tx.conn, patch);
        if (Object.keys(values).length === 0) return;
        const before = await findProject(tx.conn, id);
        const switching =
          values.workflowId !== undefined &&
          values.workflowId !== (before?.workflowId ?? null);
        if (switching)
          await deps
            .workflows()
            .assertCompatible(tx.conn, id, values.workflowId ?? null);
        await updateProject(tx.conn, id, values);
        if (switching) deps.workflows().switched(tx, values.workflowId ?? null);
        if (values.leadUserId)
          await addMember(tx.conn, deps.ids.next(), id, values.leadUserId);
      });
      return detail(deps, deps.tx.read(), id);
    },

    async remove(viewer, id) {
      await deps.tx.run(async (tx) => {
        await requireVisible(tx.conn, viewer, id);
        if (scopeOf(viewer, 'pm.projects', 'delete') !== 'all')
          throw forbidden('Only an administrator may delete a project.');
        await deps.issues().detach(tx, id, viewer.actor);
        await deleteProject(tx.conn, id);
      });
    },

    async retract(viewer, id) {
      await deps.tx.run(async (tx) => {
        const relation = await requireVisible(tx.conn, viewer, id);
        if (
          !canManage(viewer, relation) &&
          scopeOf(viewer, 'pm.projects', 'delete') !== 'all'
        )
          throw forbidden(
            'Only the project lead or an administrator may take a project back.',
          );
        const counts = await deps.issues().counts(tx.conn, [id]);
        if ((counts.get(id)?.total ?? 0) > 0)
          throw conflict(
            'PROJECT_NOT_EMPTY',
            'The project has issues; it cannot be taken back.',
          );
        await deps.issues().detach(tx, id, viewer.actor);
        await deleteProject(tx.conn, id);
      });
    },
  };
}
