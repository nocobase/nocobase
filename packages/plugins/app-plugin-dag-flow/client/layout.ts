import type { WorkflowGraph } from './graph.js';

export type WorkflowLayoutDirection = 'RIGHT' | 'DOWN';
export interface WorkflowLayoutNode {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly ports: readonly WorkflowLayoutPort[];
}
export interface WorkflowLayoutPort {
  readonly id: string;
  readonly side: 'EAST' | 'NORTH' | 'SOUTH' | 'WEST';
  readonly index: number;
}
export interface WorkflowLayoutEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly sourcePort: string | null;
  readonly targetPort: string;
}
export interface WorkflowLayoutInput {
  readonly direction: WorkflowLayoutDirection;
  readonly nodes: readonly WorkflowLayoutNode[];
  readonly edges: readonly WorkflowLayoutEdge[];
}
export interface WorkflowLayoutPosition {
  readonly id: string;
  readonly x: number;
  readonly y: number;
}
export interface WorkflowLayoutResult {
  readonly positions: readonly WorkflowLayoutPosition[];
  readonly routes: readonly WorkflowLayoutEdgeRoute[];
}
export interface WorkflowLayoutPoint {
  readonly x: number;
  readonly y: number;
}
export interface WorkflowLayoutEdgeRoute {
  readonly id: string;
  readonly points: readonly WorkflowLayoutPoint[];
}
export interface PositionedWorkflowGraph {
  readonly graph: WorkflowGraph;
  readonly positions: ReadonlyMap<string, WorkflowLayoutPosition>;
}

function branchPortId(nodeId: string, branchKey: string): string {
  return `${nodeId}:branch:${branchKey}`;
}

function inputPortId(nodeId: string): string {
  return `${nodeId}:input`;
}

function orderedBranchKeys(graph: WorkflowGraph, nodeId: string): string[] {
  const branchKeys = graph.edges
    .filter(
      (edge) =>
        edge.source === nodeId &&
        edge.kind === 'branch' &&
        edge.branchKey !== null,
    )
    .map((edge) => edge.branchKey as string);
  return branchKeys.sort((left, right) => {
    const rank = (key: string): number =>
      key === 'no' ? 0 : key === 'yes' ? 1 : 2;
    return rank(left) - rank(right);
  });
}

export function createLayoutInput(
  graph: WorkflowGraph,
  direction: WorkflowLayoutDirection = 'DOWN',
): WorkflowLayoutInput {
  return {
    direction,
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      width: node.width,
      height: node.height,
      ports: [
        ...(graph.edges.some((edge) => edge.target === node.id)
          ? [
              {
                id: inputPortId(node.id),
                side:
                  direction === 'DOWN' ? ('NORTH' as const) : ('WEST' as const),
                index: 0,
              },
            ]
          : []),
        ...orderedBranchKeys(graph, node.id).map(
          (branchKey, index, branchKeys) => ({
            id: branchPortId(node.id, branchKey),
            side: direction === 'DOWN' ? ('SOUTH' as const) : ('EAST' as const),
            index: direction === 'DOWN' ? branchKeys.length - index - 1 : index,
          }),
        ),
      ],
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourcePort:
        edge.kind === 'branch' && edge.branchKey !== null
          ? branchPortId(edge.source, edge.branchKey)
          : null,
      targetPort: inputPortId(edge.target),
    })),
  };
}

export function applyLayoutResult(
  graph: WorkflowGraph,
  result: WorkflowLayoutResult,
): PositionedWorkflowGraph {
  return {
    graph,
    positions: new Map(
      result.positions.map((position) => [position.id, position]),
    ),
  };
}
