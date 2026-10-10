import type { Row } from '@nocobase/db';
import type { WorkflowFlatIr } from '../../dsl/definition.js';

import type { WorkflowStore } from '../collections/store.js';
import type { WorkflowId } from '../engine/types.js';
import {
  asId,
  asIdFilter,
  hydrateWorkflow,
  serializeJson,
} from '../engine/utils.js';
import { retainCompatibleWorkflowParameterValues } from '../../shared/parameters.js';

export interface MaterializedWorkflowSource {
  key: string;
  hash: string;
  filePath: string;
  ir: WorkflowFlatIr;
}
export interface WorkflowSourceMaterializeResult {
  action: 'created' | 'unchanged';
  workflowId: WorkflowId;
}

function nextVersion(rows: readonly Row[]): string {
  const highest = rows.reduce((maximum, row) => {
    const match = /^(?:version-)?(\d+)$/.exec(String(row.version ?? ''));
    return Math.max(maximum, match ? Number(match[1]) : 0);
  }, 0);
  return `version-${highest + 1}`;
}

export async function materializeWorkflowSource(
  loaded: MaterializedWorkflowSource,
  store: WorkflowStore,
): Promise<WorkflowSourceMaterializeResult> {
  const revisions = await store.workflows.findMany({
    filter: { key: loaded.key },
    sort: (sort) => sort.field('id').desc(),
  });
  const unchanged = revisions.find((row) => row.hash === loaded.hash);
  if (unchanged) return { action: 'unchanged', workflowId: asId(unchanged.id) };
  const currentRow = revisions.find((row) => Boolean(row.current));
  const current = currentRow ? hydrateWorkflow(currentRow) : null;
  const parametersSchema = loaded.ir.parameters ?? {};
  const inheritedInputValues = retainCompatibleWorkflowParameterValues(
    parametersSchema,
    current?.parameterValues,
  );
  const created = await store.workflows.createOne({
    values: {
      key: loaded.key,
      hash: loaded.hash,
      version: nextVersion(revisions),
      title: loaded.ir.title,
      description: loaded.ir.description ?? null,
      options: serializeJson(loaded.ir.options ?? {}),
      inputSchema: serializeJson(loaded.ir.inputSchema),
      parametersSchema: serializeJson(parametersSchema),
      parameterValues: serializeJson(inheritedInputValues),
      client: serializeJson(loaded.ir.client ?? {}),
      enabled: false,
      current: null,
    },
    select: (select) => select.fields('id'),
  });
  const workflowId = asId(created.record.id);
  // Written as a non-empty tuple because that is the shape `createMany` takes;
  // it refuses an empty batch rather than silently doing nothing.
  const [firstNode, ...otherNodes] = loaded.ir.nodes.map((node) => ({
    workflowId: asIdFilter(workflowId),
    key: node.key,
    title: node.title ?? null,
    description: node.description ?? null,
    type: node.type,
    config: serializeJson(node.config),
    options: serializeJson(node.options ?? {}),
    upstreamKey: node.upstreamKey,
    downstreamKey: node.downstreamKey,
    branchKey: node.branchKey,
  }));
  if (firstNode) {
    await store.nodes.createMany({ values: [firstNode, ...otherNodes] });
  }
  return { action: 'created', workflowId };
}

export async function activateWorkflowSource(
  store: WorkflowStore,
  workflowId: WorkflowId,
): Promise<void> {
  const selected = await store.workflows.findOne({
    filter: { id: asIdFilter(workflowId) },
    select: (select) => select.fields('key'),
  });
  if (!selected)
    throw new Error(`Workflow ${String(workflowId)} was not found.`);
  const key = String(selected.key);
  const previous = await store.workflows.findOne({
    filter: { key, current: true },
    select: (select) => select.fields('enabled'),
  });
  const inheritedEnabled = previous ? Boolean(previous.enabled) : false;
  // A workflow key can have at most one enabled revision, and it must be current.
  // Clear stale state before selecting the new current revision so historical
  // rows cannot remain enabled after activation.
  await store.workflows.updateMany({
    filter: { key },
    values: { current: null, enabled: false },
  });
  await store.workflows.updateMany({
    filter: { id: asIdFilter(workflowId) },
    values: { current: true, enabled: inheritedEnabled },
  });
}
