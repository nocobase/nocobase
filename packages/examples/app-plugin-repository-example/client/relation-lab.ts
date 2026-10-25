import { createUuid } from '@nocobase/app-client';
import type { ApiClient } from '@nocobase/app-client';
import type { JsonValue, RemoteSelectAst } from '@nocobase/api-client';
import {
  loadRelationProjectState,
  relationRepositories,
  relationProjectSelect,
  type RelationMutationCall,
  type RelationProjectState,
} from './relation-mutations.js';

export const relationOperations = [
  'create',
  'connect',
  'disconnect',
  'set',
  'update',
  'upsert',
  'delete',
] as const;
export type RelationOperation = (typeof relationOperations)[number];
export type LabRelation = 'profile' | 'tasks' | 'tags';
export interface RelationLab {
  readonly projectId: string;
  readonly relation: LabRelation;
  readonly operation: RelationOperation;
  readonly targetIds: readonly string[];
  readonly nextId: string;
}
export interface LabInput {
  readonly targetId: string;
  readonly selectedIds: readonly string[];
  readonly content: string;
  readonly points: number;
  readonly status: string;
  readonly role: string;
}
export interface LabTarget {
  readonly id: string;
  readonly exists: boolean;
  readonly linked: boolean;
  readonly record?: Record<string, unknown>;
  readonly role?: string | null;
}
export interface RelationLabState {
  readonly project: RelationProjectState;
  readonly targets: readonly LabTarget[];
}
export interface LabMutationResult {
  readonly lab: RelationLab;
  readonly call: RelationMutationCall;
}
const targetRepository = (relation: LabRelation): string =>
  relationRepositories[relation === 'profile' ? 'profiles' : relation];
const freshId = (): string => `lab-${createUuid()}`;
function targetValues(
  relation: LabRelation,
  input: LabInput,
): Record<string, string | number> {
  if (relation === 'profile') return { summary: input.content };
  if (relation === 'tags') return { label: input.content };
  return { title: input.content, points: input.points, status: input.status };
}

/** Each card owns fresh targets, so deletion never targets shared seed records. */
export async function prepareRelationLab(
  api: ApiClient,
  operation: RelationOperation,
  relation: LabRelation,
): Promise<RelationLab> {
  if (operation === 'set' && relation === 'profile')
    throw new Error('set requires a to-many relation.');
  const projectId = freshId();
  const targetIds: string[] = [];
  for (const name of ['A', 'B', 'C', 'D']) {
    const id = freshId();
    await api.repository(targetRepository(relation)).createOne({
      values: {
        id,
        ...targetValues(relation, {
          content: `Example ${name} ${id.slice(-8)}`,
          points: name === 'A' ? 1 : 2,
          status: 'draft',
          targetId: '',
          selectedIds: [],
          role: '',
        }),
      },
    });
    targetIds.push(id);
  }
  await api.repository(relationRepositories.projects).createOne({
    values: {
      id: projectId,
      name: `${operation} · ${relation} · ${projectId.slice(-8)}`,
    },
  });
  const linkedIds =
    relation === 'profile'
      ? operation === 'create' ||
        operation === 'connect' ||
        operation === 'upsert'
        ? []
        : targetIds.slice(0, 1)
      : targetIds.slice(0, 2);
  if (linkedIds.length)
    await api.repository(relationRepositories.projects).updateOne({
      filter: { id: projectId },
      values: {
        [relation]: {
          connect:
            relation === 'profile'
              ? { id: linkedIds[0] }
              : linkedIds.map((id) =>
                  relation === 'tags'
                    ? { where: { id }, through: { role: 'baseline' } }
                    : { id },
                ),
        },
      },
    });
  return { projectId, relation, operation, targetIds, nextId: freshId() };
}

export async function loadRelationLab(
  api: ApiClient,
  lab: RelationLab,
): Promise<RelationLabState> {
  const project = await loadRelationProjectState(api, lab.projectId);
  if (!project.project)
    throw new Error('The example project no longer exists.');
  const related =
    lab.relation === 'profile'
      ? project.project.profile
        ? [project.project.profile]
        : []
      : (project.project[lab.relation] ?? []);
  const linkedIds = new Set(related.map((record) => record.id));
  const records = new Map<string, Record<string, unknown>>();
  for (let offset = 0; offset < lab.targetIds.length; offset += 100) {
    const batch = lab.targetIds.slice(offset, offset + 100);
    const rows = await api.repository(targetRepository(lab.relation)).findMany({
      limit: 100,
      filter: (f) => f.or(batch.map((id) => f.string('id').eq(id))),
    });
    for (const row of rows) records.set(String(row.id), row);
  }
  return {
    project,
    targets: lab.targetIds.map((id) => ({
      id,
      exists: records.has(id),
      linked: linkedIds.has(id),
      record: records.get(id),
      role: project.through.find((edge) => edge.tagId === id)?.role,
    })),
  };
}

export function relationLabRequest(
  lab: RelationLab,
  input: LabInput,
): {
  filter: { id: string };
  values: Record<string, JsonValue>;
  select: RemoteSelectAst;
} {
  const { relation, operation } = lab;
  const values = targetValues(relation, input);
  const selector = (id: string): JsonValue =>
    relation === 'tags'
      ? { where: { id }, through: { role: input.role } }
      : { id };
  let payload: JsonValue;
  switch (operation) {
    case 'create':
      payload =
        relation === 'tags'
          ? {
              values: { id: lab.nextId, ...values },
              through: { role: input.role },
            }
          : { id: lab.nextId, ...values };
      break;
    case 'connect':
      payload = selector(input.targetId);
      break;
    case 'disconnect':
      payload = relation === 'profile' ? true : { id: input.targetId };
      break;
    case 'set':
      if (relation === 'profile')
        throw new Error('set requires a to-many relation.');
      payload = input.selectedIds.map(selector);
      break;
    case 'update':
      payload = {
        ...(relation === 'profile' ? {} : { filter: { id: input.targetId } }),
        values,
      };
      break;
    case 'upsert':
      payload = {
        ...(relation === 'profile' ? {} : { filter: { id: input.targetId } }),
        create: { id: input.targetId || lab.nextId, ...values },
        update: values,
      };
      break;
    case 'delete':
      payload =
        relation === 'profile' ? true : { filter: { id: input.targetId } };
      break;
  }
  return {
    filter: { id: lab.projectId },
    values: { [relation]: { [operation]: payload } },
    select: relationProjectSelect,
  };
}

export async function executeRelationLab(
  api: ApiClient,
  lab: RelationLab,
  input: LabInput,
): Promise<LabMutationResult> {
  const options = relationLabRequest(lab, input);
  const result = await api
    .repository(relationRepositories.projects)
    .updateOne(options);
  const related = result.record[lab.relation];
  const relatedRows: unknown[] = Array.isArray(related)
    ? related
    : related
      ? [related]
      : [];
  const returnedIds = relatedRows.flatMap((row) => {
    if (
      row &&
      typeof row === 'object' &&
      'id' in row &&
      typeof row.id === 'string'
    )
      return [row.id];
    return [];
  });
  return {
    lab: {
      ...lab,
      targetIds: [...new Set([...lab.targetIds, ...returnedIds])],
      nextId: freshId(),
    },
    call: {
      repository: relationRepositories.projects,
      action: 'updateOne',
      options,
      result,
    },
  };
}
