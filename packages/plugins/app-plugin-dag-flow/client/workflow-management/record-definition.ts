import {
  restoreFromFlatIr,
  type JsonObject,
  type WorkflowNestedDefinition,
} from '@nocobase/app-plugin-dag-flow/client';
import type { WorkflowDetailRecord } from './types.js';

export function definition(
  workflow: WorkflowDetailRecord,
): WorkflowNestedDefinition {
  return restoreFromFlatIr({
    title: workflow.title ?? workflow.key,
    ...(workflow.description ? { description: workflow.description } : {}),
    inputSchema: workflow.inputSchema,
    parameters: normalizeWorkflowParameters(workflow.parametersSchema),
    start: workflow.nodes.find((node) => node.upstreamKey == null)?.key ?? null,
    nodes: workflow.nodes.map((node) => ({
      key: node.key,
      title: node.title ?? undefined,
      description: node.description ?? undefined,
      type: node.type,
      config: node.config,
      upstreamKey: node.upstreamKey,
      downstreamKey: node.downstreamKey,
      branchKey: node.branchKey,
    })),
  });
}
function normalizeWorkflowParameters(
  parametersSchema: WorkflowDetailRecord['parametersSchema'],
): JsonObject {
  return Object.fromEntries(
    Object.entries(parametersSchema).map(([key, input]) => [
      key,
      {
        type: input.type,
        ...(input.title === undefined ? {} : { title: input.title }),
        ...(input.description === undefined
          ? {}
          : { description: input.description }),
        ...(input.default === undefined ? {} : { default: input.default }),
        ...(input.enum === undefined ? {} : { enum: input.enum }),
      },
    ]),
  );
}
