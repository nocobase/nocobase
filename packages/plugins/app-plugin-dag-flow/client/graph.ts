import type {
  JsonObject,
  WorkflowGraphDefinition,
  WorkflowGraphDefinitionNode,
} from './types.js';

export type WorkflowGraphNodeKind =
  'start' | 'workflow-node' | 'branch-anchor' | 'end';
export type WorkflowGraphEdgeKind = 'main' | 'branch';

export interface WorkflowNodeVisualContract {
  readonly type: string;
  readonly title: string;
  readonly getBranchKeys: (config: JsonObject) => readonly string[];
  readonly terminal?: boolean;
  readonly getBranchLabel?: (branchKey: string, config: JsonObject) => string;
  readonly summarizeConfig?: (config: JsonObject) => string | null;
}

export interface WorkflowGraphNode {
  readonly id: string;
  readonly kind: WorkflowGraphNodeKind;
  readonly workflowNodeKey: string | null;
  readonly nodeType: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly virtual: boolean;
  readonly width: number;
  readonly height: number;
  readonly branchOwnerKey: string | null;
  readonly branchKey: string | null;
  readonly config: JsonObject | null;
  readonly summary: string | null;
}

export interface WorkflowGraphEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly kind: WorkflowGraphEdgeKind;
  readonly terminal?: boolean;
  readonly branchOwnerKey: string | null;
  readonly branchKey: string | null;
  readonly label: string | null;
}

export interface WorkflowGraph {
  readonly definitionKey: string;
  readonly nodes: readonly WorkflowGraphNode[];
  readonly edges: readonly WorkflowGraphEdge[];
}

export type WorkflowNodeContractRegistry = ReadonlyMap<
  string,
  WorkflowNodeVisualContract
>;

const DEFAULT_CONTRACTS: WorkflowNodeContractRegistry = new Map<
  string,
  WorkflowNodeVisualContract
>([
  [
    'condition',
    {
      type: 'condition',
      title: 'Condition',
      getBranchKeys: () => ['yes', 'no'],
    },
  ],
  [
    'terminate',
    {
      type: 'terminate',
      title: 'Terminate',
      getBranchKeys: () => [],
      terminal: true,
    },
  ],
  ['run', { type: 'run', title: 'Run', getBranchKeys: () => [] }],
]);

export function workflowNodeId(nodeKey: string): string {
  return `node:${nodeKey}`;
}
export function branchAnchorId(ownerKey: string, branchKey: string): string {
  return `branch:${ownerKey}:${branchKey}`;
}
export function mergeNodeId(ownerKey: string): string {
  return `merge:${ownerKey}`;
}
export function startNodeId(): string {
  return 'start';
}
export function endNodeId(): string {
  return 'end';
}
export function edgeId(
  source: string,
  target: string,
  kind: WorkflowGraphEdgeKind,
): string {
  return `edge:${kind}:${source}:${target}`;
}
export function branchEdgeId(
  source: string,
  branchKey: string,
  target: string,
): string {
  return `edge:branch:${source}:${branchKey}:${target}`;
}

function contractFor(
  node: WorkflowGraphDefinitionNode,
  contracts: WorkflowNodeContractRegistry,
): WorkflowNodeVisualContract | null {
  return contracts.get(node.type) ?? DEFAULT_CONTRACTS.get(node.type) ?? null;
}

function addNode(nodes: WorkflowGraphNode[], node: WorkflowGraphNode): void {
  if (!nodes.some((candidate) => candidate.id === node.id)) nodes.push(node);
}

function addEdge(edges: WorkflowGraphEdge[], edge: WorkflowGraphEdge): void {
  if (!edges.some((candidate) => candidate.id === edge.id)) edges.push(edge);
}

function projectBlock(
  block: readonly WorkflowGraphDefinitionNode[],
  continuationId: string,
  nodes: WorkflowGraphNode[],
  edges: WorkflowGraphEdge[],
  contracts: WorkflowNodeContractRegistry,
): string {
  let nextId = continuationId;
  for (let index = block.length - 1; index >= 0; index -= 1) {
    const node = block[index];
    const nodeId = workflowNodeId(node.key);
    const contract = contractFor(node, contracts);
    addNode(nodes, {
      id: nodeId,
      kind: 'workflow-node',
      workflowNodeKey: node.key,
      nodeType: node.type,
      title: node.title ?? contract?.title ?? node.type,
      description: node.description ?? null,
      virtual: false,
      width: 240,
      height: 88,
      branchOwnerKey: null,
      branchKey: null,
      config: node.config,
      summary: contract?.summarizeConfig?.(node.config) ?? null,
    });
    if (contract?.terminal === true) {
      addEdge(edges, {
        id: edgeId(nodeId, endNodeId(), 'main'),
        source: nodeId,
        target: endNodeId(),
        kind: 'main',
        terminal: true,
        branchOwnerKey: null,
        branchKey: null,
        label: null,
      });
      nextId = nodeId;
      continue;
    }
    const branchKeys = [
      ...(contract?.getBranchKeys(node.config) ??
        Object.keys(node.branches ?? {})),
    ];
    if (branchKeys.length === 0) {
      addEdge(edges, {
        id: edgeId(nodeId, nextId, 'main'),
        source: nodeId,
        target: nextId,
        kind: 'main',
        branchOwnerKey: null,
        branchKey: null,
        label: null,
      });
      nextId = nodeId;
      continue;
    }
    const continuationId = nextId;
    for (const branchKey of branchKeys) {
      const branch = node.branches?.[branchKey] ?? [];
      if (branch.length === 0) {
        addEdge(edges, {
          id: branchEdgeId(nodeId, branchKey, continuationId),
          source: nodeId,
          target: continuationId,
          kind: 'branch',
          branchOwnerKey: node.key,
          branchKey,
          label:
            contract?.getBranchLabel?.(branchKey, node.config) ?? branchKey,
        });
      } else {
        const headId = projectBlock(
          branch,
          continuationId,
          nodes,
          edges,
          contracts,
        );
        addEdge(edges, {
          id: branchEdgeId(nodeId, branchKey, headId),
          source: nodeId,
          target: headId,
          kind: 'branch',
          branchOwnerKey: node.key,
          branchKey,
          label:
            contract?.getBranchLabel?.(branchKey, node.config) ?? branchKey,
        });
      }
    }
    nextId = nodeId;
  }
  return nextId;
}

export function projectWorkflowGraph(
  definition: WorkflowGraphDefinition,
  contracts: WorkflowNodeContractRegistry = new Map(),
): WorkflowGraph {
  const nodes: WorkflowGraphNode[] = [];
  const edges: WorkflowGraphEdge[] = [];
  const end = endNodeId();
  addNode(nodes, {
    id: end,
    kind: 'end',
    workflowNodeKey: null,
    nodeType: null,
    title: 'End',
    description: null,
    virtual: true,
    width: 108,
    height: 48,
    branchOwnerKey: null,
    branchKey: null,
    config: null,
    summary: null,
  });
  const start = projectBlock(definition.nodes, end, nodes, edges, contracts);
  const startNode = startNodeId();
  addNode(nodes, {
    id: startNode,
    kind: 'start',
    workflowNodeKey: null,
    nodeType: null,
    title: 'Start',
    description: null,
    virtual: true,
    width: 108,
    height: 48,
    branchOwnerKey: null,
    branchKey: null,
    config: null,
    summary: null,
  });
  addEdge(edges, {
    id: edgeId(startNode, start, 'main'),
    source: startNode,
    target: start,
    kind: 'main',
    branchOwnerKey: null,
    branchKey: null,
    label: null,
  });
  return { definitionKey: definition.title, nodes, edges };
}
