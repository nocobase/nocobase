import type { WorkflowDetailRecord, WorkflowNodeRecord } from './types.js';

export type DifferenceStatus = 'added' | 'removed' | 'changed' | 'unchanged';
export interface FieldDifference {
  path: string;
  before: unknown;
  after: unknown;
}
export interface NodeDifference {
  key: string;
  before?: WorkflowNodeRecord;
  after?: WorkflowNodeRecord;
  status: DifferenceStatus;
  connectionsChanged: boolean;
  fields: FieldDifference[];
}
function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/** JSON Pointer paths preserve keys containing dots, slashes, or tildes. Object order is irrelevant; array order is meaningful. */
export function diffFields(
  before: unknown,
  after: unknown,
  path = '',
): FieldDifference[] {
  if (Object.is(before, after)) return [];
  if (
    (object(before) && object(after)) ||
    (Array.isArray(before) && Array.isArray(after))
  ) {
    const left = before as Record<string, unknown>;
    const right = after as Record<string, unknown>;
    return [...new Set([...Object.keys(left), ...Object.keys(right)])]
      .sort()
      .flatMap((key) =>
        diffFields(
          Object.hasOwn(left, key) ? left[key] : undefined,
          Object.hasOwn(right, key) ? right[key] : undefined,
          `${path}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`,
        ),
      );
  }
  return [{ path: path || '/', before, after }];
}
function nodeDefinition(node: WorkflowNodeRecord): object {
  return {
    title: node.title,
    description: node.description,
    type: node.type,
    config: node.config,
    upstreamKey: node.upstreamKey,
    downstreamKey: node.downstreamKey,
    branchKey: node.branchKey,
  };
}
/** Ignore intermediate nodes that exist in only one version. */
function commonUpstream(
  node: WorkflowNodeRecord,
  own: ReadonlyMap<string, WorkflowNodeRecord>,
  other: ReadonlyMap<string, WorkflowNodeRecord>,
): string | null {
  let key = node.upstreamKey;
  const visited = new Set([node.key]);
  while (key !== null && !other.has(key)) {
    // Preserve unresolved references and stop malformed cycles rather than hanging the UI.
    if (visited.has(key)) return key;
    visited.add(key);
    const upstream = own.get(key);
    if (!upstream) return key;
    key = upstream.upstreamKey;
  }
  return key;
}

export function compareVersions(
  before: WorkflowDetailRecord,
  after: WorkflowDetailRecord,
): { nodes: NodeDifference[]; fields: FieldDifference[] } {
  const left = new Map(before.nodes.map((node) => [node.key, node]));
  const right = new Map(after.nodes.map((node) => [node.key, node]));
  const nodes = [...new Set([...left.keys(), ...right.keys()])].map((key) => {
    const oldNode = left.get(key),
      newNode = right.get(key);
    const fields = diffFields(
      oldNode && nodeDefinition(oldNode),
      newNode && nodeDefinition(newNode),
    );
    const connectionsChanged = Boolean(
      oldNode &&
      newNode &&
      commonUpstream(oldNode, left, right) !==
        commonUpstream(newNode, right, left),
    );
    const status: DifferenceStatus = !oldNode
      ? 'added'
      : !newNode
        ? 'removed'
        : connectionsChanged ||
            fields.some(
              (field) =>
                field.path !== '/downstreamKey' &&
                field.path !== '/upstreamKey',
            )
          ? 'changed'
          : 'unchanged';
    return {
      key,
      before: oldNode,
      after: newNode,
      status,
      fields,
      connectionsChanged,
    };
  });
  const metadata = (version: WorkflowDetailRecord): object => ({
    title: version.title,
    description: version.description,
    inputSchema: version.inputSchema,
    parametersSchema: version.parametersSchema,
  });
  return { nodes, fields: diffFields(metadata(before), metadata(after)) };
}
