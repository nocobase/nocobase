/**
 * Workflows: the statuses of a project's issues and who may move an issue between them. Every member reads them; the
 * settings item `pm.workflows`'s `update` creates, edits and deletes them and picks the default.
 *
 * A workflow keeps the issues that use it valid: a change that drops a status some issue is in, a project switching
 * to a workflow without such a status, and a new default missing a status of issues on the default are all refused
 * with 400 `WORKFLOW_STATUS_CONFLICT`, listing the issues per status and project. The default workflow is never
 * deleted, nor one a project uses (400 `WORKFLOW_IN_USE`).
 *
 * Other plugins' templates (`templates.ts`) are installed once each (`installTemplate`); `preview` says what saving a
 * definition would change in the rules, before it is saved.
 *
 * The issues domain reads statuses through `catalogs` (compiled once per workflow and kept until a write in this
 * process), and the projects domain checks a project's choice through `projects`.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type {
  IssueStartOption,
  StatusDefinition,
} from '../../../shared/issues.js';
import {
  ANY_STATUS,
  BUILTIN_STATUSES,
  INITIAL_STATUS,
  WORKFLOW_NAME_MAX,
  type CreateWorkflowRequest,
  type UpdateWorkflowRequest,
  type Workflow,
  type WorkflowDefinition,
  type WorkflowListItem,
  type WorkflowPreview,
  type WorkflowStatusConflict,
} from '../../../shared/workflows.js';
import { requireSetting, type Viewer } from '../../access/viewer.js';
import { isUniqueViolation, unique } from '../../kernel/db.js';
import { conflict, invalid, notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import { optionalText, requiredText } from '../../kernel/validate.js';
import { compile } from '../../lifecycle/index.js';
import type { StatusCatalog, StatusCatalogs } from '../issues/index.js';
import './workflow.events.js';
import type { IssueRules } from '../issues/index.js';
import { checkDefinition } from './workflow.rules.js';
import { ruleMessage } from './built-in-rule-types.js';
import type { KindRegistry } from '../../kernel/kinds.js';
import { readSettings, writeSettings } from '../settings/settings.store.js';
import type { StatusRuleTypes } from './rule-types.js';
import type { WorkflowEventTypes } from './event-types.js';
import type { WorkflowTemplate, WorkflowTemplates } from './templates.js';
import { previewRules } from './workflow.diff.js';
import {
  deleteWorkflow,
  findBuiltInWorkflow,
  findDefaultWorkflow,
  findWorkflow,
  insertWorkflow,
  issueStatusCounts,
  listWorkflows,
  projectCounts,
  projectsOnWorkflow,
  setDefaultWorkflow,
  updateWorkflow,
  workflowIdOfProject,
} from './workflow.store.js';

/** What projects need from workflows. */
export interface ProjectWorkflows {
  /** 400 `INVALID_WORKFLOW` unless the id names a workflow. */
  requireExisting(conn: DatabaseConnection, id: string): Promise<void>;
  /** 400 `WORKFLOW_STATUS_CONFLICT` when an issue of the project is in a status `workflowId` (null: the default) lacks. */
  assertCompatible(
    conn: DatabaseConnection,
    projectId: string,
    workflowId: string | null,
  ): Promise<void>;
  /** Announces that the project now uses another workflow. */
  switched(tx: Tx, workflowId: string | null): void;
}

export interface WorkflowService {
  list(viewer: Viewer): Promise<WorkflowListItem[]>;
  get(viewer: Viewer, id: string): Promise<WorkflowListItem>;
  create(
    viewer: Viewer,
    input: CreateWorkflowRequest,
  ): Promise<WorkflowListItem>;
  update(
    viewer: Viewer,
    id: string,
    input: UpdateWorkflowRequest,
  ): Promise<WorkflowListItem>;
  remove(viewer: Viewer, id: string): Promise<void>;
  setDefault(viewer: Viewer, id: string): Promise<WorkflowListItem>;
  /** What saving `definition` would change in the rules; 400 `INVALID_WORKFLOW` as saving would. Nothing is written. */
  preview(
    viewer: Viewer,
    id: string,
    input: { readonly definition: unknown },
  ): Promise<WorkflowPreview>;
  /**
   * Creates the workflow of a template unless it was installed before (even if deleted since) or a workflow with its
   * key exists; true when it created one. Its name gets the key appended when another workflow has it. With
   * `makeDefault`, it becomes the default when none is and every issue on the built-in statuses keeps its status.
   */
  installTemplate(template: WorkflowTemplate): Promise<boolean>;
  readonly catalogs: StatusCatalogs;
  readonly projects: ProjectWorkflows;
}

/**
 * The statuses of every project while no workflow is the default (the plugin ships none): the built-in statuses,
 * people move freely and the system closes merged work. A new workflow may start from it (`copyFrom: null`).
 */
const FALLBACK: WorkflowDefinition = {
  states: BUILTIN_STATUSES,
  transitions: [
    { from: ANY_STATUS, to: ANY_STATUS, actors: ['user'] },
    { from: ANY_STATUS, to: 'done', actors: ['system'] },
  ],
};

/**
 * The ways a new issue may start: none while no status carries a `startOption` rule; otherwise the initial status
 * first, then every status carrying one, in the workflow's order.
 */
function startsOf(
  definition: WorkflowDefinition,
  byKey: ReadonlyMap<string, StatusDefinition>,
): IssueStartOption[] {
  const offered: IssueStartOption[] = [];
  for (const state of definition.states) {
    const rule = state.rules?.find((item) => item.type === 'startOption');
    const status = byKey.get(state.key);
    if (!rule || !status) continue;
    const config = ('config' in rule ? (rule.config ?? {}) : {}) as Readonly<
      Record<string, unknown>
    >;
    offered.push({
      status,
      label: ruleMessage(config.label),
      hint: ruleMessage(config.hint),
    });
  }
  if (offered.length === 0) return [];
  const initial = offered.find(
    (option) => option.status.key === INITIAL_STATUS,
  );
  const initialStatus = byKey.get(INITIAL_STATUS);
  return [
    initial ??
      (initialStatus
        ? { status: initialStatus, label: null, hint: null }
        : null),
    ...offered.filter((option) => option !== initial),
  ].filter((option): option is IssueStartOption => option !== null);
}

function catalogOf(
  definition: WorkflowDefinition,
  rules: IssueRules,
): StatusCatalog {
  const statuses: StatusDefinition[] = definition.states.map(
    ({ key, name, category, color }) => ({ key, name, category, color }),
  );
  const byKey = new Map(statuses.map((status) => [status.key, status]));
  return {
    statuses,
    initialStatus: INITIAL_STATUS,
    starts: startsOf(definition, byKey),
    category: (key) => byKey.get(key)?.category ?? null,
    machine: compile(definition),
    rules,
  };
}

function requireEditor(viewer: Viewer): void {
  requireSetting(
    viewer,
    'pm.workflows',
    'update',
    'You may not change workflows.',
  );
}

const nameOf = (value: unknown) =>
  requiredText(value, 'name', WORKFLOW_NAME_MAX, 'INVALID_NAME');

/** Runs a write whose unique name may already be taken. */
async function uniquely<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error))
      throw conflict(
        'WORKFLOW_EXISTS',
        'A workflow with this name already exists.',
      );
    throw error;
  }
}

/** The issues of `projectIds` (and, with `loose`, those without a project) per status `keep` does not contain. */
async function lostStatuses(
  conn: DatabaseConnection,
  projectIds: readonly string[],
  loose: boolean,
  keep: ReadonlySet<string>,
) {
  const counts = await issueStatusCounts(conn, projectIds, loose);
  return counts.filter((entry) => !keep.has(entry.statusKey));
}

/**
 * 400 `WORKFLOW_STATUS_CONFLICT` when issues of `projectIds` (and, with `loose`, issues without a project) are in a
 * status `keep` does not contain.
 */
async function assertStatusesKept(
  conn: DatabaseConnection,
  projectIds: readonly string[],
  loose: boolean,
  keep: ReadonlySet<string>,
  names: ReadonlyMap<string, string>,
): Promise<void> {
  const conflicts = (await lostStatuses(conn, projectIds, loose, keep)).map(
    (entry) => ({
      ...entry,
      projectName: entry.projectId
        ? (names.get(entry.projectId) ?? null)
        : null,
    }),
  );
  if (conflicts.length === 0) return;
  const details: WorkflowStatusConflict = { conflicts };
  throw conflict(
    'WORKFLOW_STATUS_CONFLICT',
    `Issues are still in ${unique(conflicts.map((entry) => entry.statusKey)).join(', ')}; move them first.`,
    { ...details },
  );
}

const keysOf = (definition: WorkflowDefinition) =>
  new Set(definition.states.map((state) => state.key));

export function createWorkflowService(deps: {
  readonly tx: TxRunner;
  readonly ids: IdSource;
  /** The rules a workflow may name. */
  readonly registry: IssueRules;
  /** The kinds a transition may name. */
  readonly kinds: KindRegistry;
  /** Every status rule type: this plugin's own and those other plugins contribute. */
  readonly ruleTypes?: StatusRuleTypes;
  /** The workflow events other plugins contribute. */
  readonly events?: WorkflowEventTypes;
  /** Other plugins' templates, for the names of the workflows they created. */
  readonly templates?: WorkflowTemplates;
}): WorkflowService {
  const catalogs = new Map<string, StatusCatalog>();
  let defaultId: string | null | undefined;
  const invalidate = () => {
    catalogs.clear();
    defaultId = undefined;
  };

  async function defaultWorkflow(
    conn: DatabaseConnection,
  ): Promise<Workflow | undefined> {
    return findDefaultWorkflow(conn);
  }

  async function catalogFor(
    conn: DatabaseConnection,
    id: string | null,
  ): Promise<StatusCatalog> {
    if (id === null) {
      if (defaultId === undefined)
        defaultId = (await defaultWorkflow(conn))?.id ?? null;
      if (defaultId === null) return catalogOf(FALLBACK, deps.registry);
      id = defaultId;
    }
    const cached = catalogs.get(id);
    if (cached) return cached;
    const workflow = await findWorkflow(conn, id);
    // A project pointing at a missing workflow uses the default rather than failing every request.
    if (!workflow)
      return id === defaultId
        ? catalogOf(FALLBACK, deps.registry)
        : catalogFor(conn, null);
    const catalog = catalogOf(workflow.definition, deps.registry);
    catalogs.set(id, catalog);
    return catalog;
  }

  /** The list item: its projects, and a template's translated name and description while it keeps the template's. */
  function itemOf(
    workflow: Workflow,
    counts: ReadonlyMap<string | null, number>,
  ): WorkflowListItem {
    const template = workflow.builtInKey
      ? deps.templates?.get(workflow.builtInKey)
      : undefined;
    const title =
      template?.title &&
      typeof template.title !== 'string' &&
      template.name === workflow.name
        ? { title: template.title }
        : {};
    const description =
      typeof template?.description === 'object' &&
      template.description.defaultValue === workflow.description
        ? {
            descriptionTitle: {
              key: template.description.key,
              ns: template.description.ns,
            },
          }
        : {};
    return {
      ...workflow,
      projectCount:
        (counts.get(workflow.id) ?? 0) +
        (workflow.isDefault ? (counts.get(null) ?? 0) : 0),
      ...title,
      ...description,
    };
  }

  async function withCount(
    conn: DatabaseConnection,
    workflow: Workflow,
  ): Promise<WorkflowListItem> {
    return itemOf(workflow, await projectCounts(conn));
  }

  const INSTALLED = 'installedWorkflowTemplates';

  async function installedTemplates(
    conn: DatabaseConnection,
  ): Promise<{ values: Record<string, unknown>; keys: string[] }> {
    const row = await readSettings(conn);
    const raw: unknown =
      typeof row?.values === 'string'
        ? JSON.parse(row.values)
        : (row?.values ?? {});
    const values = (raw && typeof raw === 'object' ? raw : {}) as Record<
      string,
      unknown
    >;
    const keys = Array.isArray(values[INSTALLED])
      ? (values[INSTALLED] as unknown[]).filter(
          (key): key is string => typeof key === 'string',
        )
      : [];
    return { values, keys };
  }

  async function existing(
    conn: DatabaseConnection,
    id: string,
  ): Promise<Workflow> {
    const workflow = await findWorkflow(conn, id);
    if (!workflow) throw notFound('Workflow');
    return workflow;
  }

  /** The projects and loose issues a workflow's statuses apply to. */
  async function usersOf(conn: DatabaseConnection, workflow: Workflow) {
    const projects = [
      ...(await projectsOnWorkflow(conn, workflow.id)),
      ...(workflow.isDefault ? await projectsOnWorkflow(conn, null) : []),
    ];
    return {
      projectIds: projects.map((project) => project.id),
      names: new Map(projects.map((project) => [project.id, project.name])),
      loose: workflow.isDefault,
    };
  }

  /** Writes and announces a change; the cache is dropped once it committed. */
  async function write<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    try {
      return await deps.tx.run(fn);
    } finally {
      invalidate();
    }
  }

  return {
    async list() {
      const conn = deps.tx.read();
      const counts = await projectCounts(conn);
      return (await listWorkflows(conn)).map((workflow) =>
        itemOf(workflow, counts),
      );
    },

    async get(_viewer, id) {
      const conn = deps.tx.read();
      return withCount(conn, await existing(conn, id));
    },

    async create(viewer, input) {
      requireEditor(viewer);
      const name = nameOf(input.name);
      const copyFrom = input.copyFrom ?? null;
      if (copyFrom !== null && typeof copyFrom !== 'string')
        throw invalid(
          'INVALID_FIELD',
          'copyFrom names the workflow to copy, or is null for the built-in statuses.',
        );
      const id = deps.ids.next();
      await uniquely(() =>
        write(async (tx) => {
          const source =
            copyFrom === null
              ? { description: null, definition: FALLBACK }
              : await existing(tx.conn, copyFrom);
          await insertWorkflow(tx.conn, {
            id,
            name,
            description: source.description,
            definition: source.definition,
          });
          tx.emit({ type: 'workflow.changed', workflowId: id });
        }),
      );
      const conn = deps.tx.read();
      return withCount(conn, await existing(conn, id));
    },

    async update(viewer, id, input) {
      requireEditor(viewer);
      if (!Number.isInteger(input.revision))
        throw invalid('INVALID_FIELD', 'revision is required.');
      await uniquely(() =>
        write(async (tx) => {
          const before = await existing(tx.conn, id);
          const values: {
            -readonly [
              K in 'name' | 'description' | 'definition'
            ]?: Workflow[K];
          } = {
            ...(input.name === undefined ? {} : { name: nameOf(input.name) }),
            ...(input.description === undefined
              ? {}
              : {
                  description: optionalText(
                    input.description,
                    'description',
                    2000,
                  ),
                }),
          };
          if (input.definition !== undefined) {
            const definition = checkDefinition(
              input.definition,
              before.definition,
              deps.registry,
              deps.kinds,
              deps.ruleTypes,
              deps.events,
            );
            const users = await usersOf(tx.conn, before);
            await assertStatusesKept(
              tx.conn,
              users.projectIds,
              users.loose,
              keysOf(definition),
              users.names,
            );
            values.definition = definition;
          }
          if (!(await updateWorkflow(tx.conn, id, input.revision, values)))
            throw conflict(
              'REVISION_CONFLICT',
              'The workflow was changed meanwhile.',
            );
          tx.emit({ type: 'workflow.changed', workflowId: id });
        }),
      );
      const conn = deps.tx.read();
      return withCount(conn, await existing(conn, id));
    },

    async remove(viewer, id) {
      requireEditor(viewer);
      await write(async (tx) => {
        const workflow = await withCount(tx.conn, await existing(tx.conn, id));
        if (workflow.isDefault)
          throw conflict(
            'WORKFLOW_IN_USE',
            'The default workflow cannot be deleted; make another one the default first.',
          );
        if (workflow.projectCount > 0)
          throw conflict(
            'WORKFLOW_IN_USE',
            `${workflow.projectCount} projects use this workflow.`,
            { projectCount: workflow.projectCount },
          );
        await deleteWorkflow(tx.conn, id);
        tx.emit({ type: 'workflow.changed', workflowId: id });
      });
    },

    async setDefault(viewer, id) {
      requireEditor(viewer);
      await write(async (tx) => {
        const next = await existing(tx.conn, id);
        if (next.isDefault) return;
        const current = await defaultWorkflow(tx.conn);
        // Projects without a workflow of their own, and issues without a project, move to the new default.
        const projects = await projectsOnWorkflow(tx.conn, null);
        await assertStatusesKept(
          tx.conn,
          projects.map((project) => project.id),
          true,
          keysOf(next.definition),
          new Map(projects.map((project) => [project.id, project.name])),
        );
        await setDefaultWorkflow(tx.conn, id);
        tx.emit({ type: 'workflow.changed', workflowId: id });
        if (current)
          tx.emit({ type: 'workflow.changed', workflowId: current.id });
      });
      const conn = deps.tx.read();
      return withCount(conn, await existing(conn, id));
    },

    async preview(viewer, id, input) {
      requireEditor(viewer);
      const conn = deps.tx.read();
      const before = await existing(conn, id);
      const definition = checkDefinition(
        input?.definition,
        before.definition,
        deps.registry,
        deps.kinds,
        deps.ruleTypes,
        deps.events,
      );
      return previewRules(before.definition, definition, deps.ruleTypes);
    },

    async installTemplate(template) {
      try {
        return await write(async (tx) => {
          const { values, keys } = await installedTemplates(tx.conn);
          if (keys.includes(template.key)) return false;
          let created = false;
          if (!(await findBuiltInWorkflow(tx.conn, template.key))) {
            const definition = checkDefinition(
              template.definition,
              null,
              deps.registry,
              deps.kinds,
              deps.ruleTypes,
              deps.events,
            );
            const taken = (await listWorkflows(tx.conn)).some(
              (workflow) => workflow.name === template.name,
            );
            const id = deps.ids.next();
            await insertWorkflow(tx.conn, {
              id,
              name: taken
                ? `${template.name} (${template.key})`
                : template.name,
              description:
                typeof template.description === 'object'
                  ? template.description.defaultValue
                  : (template.description ?? null),
              definition,
              builtInKey: template.key,
            });
            tx.emit({ type: 'workflow.changed', workflowId: id });
            created = true;
            // The first default: projects without a workflow of their own leave the built-in statuses for it,
            // unless some issue is in a status it lacks.
            if (
              template.makeDefault &&
              !(await defaultWorkflow(tx.conn)) &&
              (
                await lostStatuses(
                  tx.conn,
                  (await projectsOnWorkflow(tx.conn, null)).map(
                    (project) => project.id,
                  ),
                  true,
                  keysOf(definition),
                )
              ).length === 0
            )
              await setDefaultWorkflow(tx.conn, id);
          }
          await writeSettings(tx.conn, {
            values: { ...values, [INSTALLED]: [...keys, template.key] },
          });
          return created;
        });
      } catch (error) {
        // Another instance installed it at the same moment.
        if (isUniqueViolation(error)) return false;
        throw error;
      }
    },

    catalogs: {
      async forProject(conn, projectId) {
        if (projectId === null) return catalogFor(conn, null);
        return catalogFor(
          conn,
          (await workflowIdOfProject(conn, projectId)) ?? null,
        );
      },
    },

    projects: {
      async requireExisting(conn, id) {
        if (!(await findWorkflow(conn, id)))
          throw invalid('INVALID_WORKFLOW', 'workflowId names no workflow.');
      },
      async assertCompatible(conn, projectId, workflowId) {
        const catalog = await catalogFor(conn, workflowId);
        await assertStatusesKept(
          conn,
          [projectId],
          false,
          new Set(catalog.statuses.map((status) => status.key)),
          new Map(),
        );
      },
      switched(tx, workflowId) {
        tx.emit({ type: 'workflow.changed', workflowId });
      },
    },
  };
}
