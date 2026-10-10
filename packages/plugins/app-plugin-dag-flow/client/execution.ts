import type { WorkflowGraph, WorkflowNodeVisualContract } from './graph.js';

export type WorkflowVisualStatus =
  'unvisited' | 'pending' | 'resolved' | 'failed' | 'error' | 'aborted';
export interface WorkflowNodeRunSummary {
  readonly id: string;
  readonly nodeKey: string;
  readonly status: number;
  readonly startedAt: string;
  readonly finishedAt: string | null;
  readonly result?: unknown;
  readonly branchKey?: string | null;
}
export interface WorkflowNodeTrace {
  readonly nodeKey: string;
  readonly nodeRuns: readonly WorkflowNodeRunSummary[];
  readonly latest: WorkflowNodeRunSummary;
  readonly visitCount: number;
  readonly status: WorkflowVisualStatus;
}
export interface WorkflowExecutionTrace {
  readonly runId: string;
  readonly runStatus: WorkflowVisualStatus;
  readonly nodesByKey: ReadonlyMap<string, WorkflowNodeTrace>;
  readonly traversedEdgeIds: ReadonlySet<string>;
  readonly activeEdgeIds: ReadonlySet<string>;
  readonly transitionEvidence: ReadonlyMap<
    string,
    'persisted' | 'observed' | 'inferred'
  >;
}
export interface WorkflowExecutionOverlay {
  readonly nodeStatus: ReadonlyMap<string, WorkflowVisualStatus>;
  readonly edgeEvidence: ReadonlyMap<
    string,
    'persisted' | 'observed' | 'inferred'
  >;
  readonly traversedEdgeIds: ReadonlySet<string>;
}

function visualStatus(status: number): WorkflowVisualStatus {
  return status === 0
    ? 'pending'
    : status === 1
      ? 'resolved'
      : status === -1
        ? 'failed'
        : status === -2
          ? 'error'
          : status === -3
            ? 'aborted'
            : 'unvisited';
}
function runStatus(status: number | null): WorkflowVisualStatus {
  return status == null ? 'pending' : visualStatus(status);
}

export function aggregateNodeRuns(
  runId: string,
  status: number | null,
  nodeRuns: readonly WorkflowNodeRunSummary[],
): WorkflowExecutionTrace {
  const groups = new Map<string, WorkflowNodeRunSummary[]>();
  for (const nodeRun of nodeRuns)
    groups.set(nodeRun.nodeKey, [
      ...(groups.get(nodeRun.nodeKey) ?? []),
      nodeRun,
    ]);
  const nodesByKey = new Map<string, WorkflowNodeTrace>();
  for (const [nodeKey, values] of groups) {
    const ordered = [...values].sort(
      (a, b) =>
        String(a.startedAt).localeCompare(String(b.startedAt)) ||
        String(a.id).localeCompare(String(b.id), 'en', { numeric: true }),
    );
    const latest = ordered[ordered.length - 1];
    nodesByKey.set(nodeKey, {
      nodeKey,
      nodeRuns: ordered,
      latest,
      visitCount: ordered.length,
      status: visualStatus(latest.status),
    });
  }
  return {
    runId,
    runStatus: runStatus(status),
    nodesByKey,
    traversedEdgeIds: new Set(),
    activeEdgeIds: new Set(),
    transitionEvidence: new Map(),
  };
}

export function overlayExecution(
  graph: WorkflowGraph,
  trace: WorkflowExecutionTrace,
): WorkflowExecutionOverlay {
  const nodeStatus = new Map<string, WorkflowVisualStatus>();
  for (const node of graph.nodes) {
    const status =
      node.id === 'start'
        ? 'resolved'
        : node.workflowNodeKey
          ? (trace.nodesByKey.get(node.workflowNodeKey)?.status ?? 'unvisited')
          : 'unvisited';
    nodeStatus.set(node.id, status);
  }
  return { nodeStatus, edgeEvidence: new Map(), traversedEdgeIds: new Set() };
}

export function buildExecutionOverlay(
  graph: WorkflowGraph,
  runId: string,
  runStatusValue: number | null,
  nodeRuns: readonly WorkflowNodeRunSummary[],
): WorkflowExecutionOverlay {
  const trace = aggregateNodeRuns(runId, runStatusValue, nodeRuns);
  const base = overlayExecution(graph, trace);
  const nodeStatus = new Map(base.nodeStatus);
  const inferred = inferTransitions(graph, nodeRuns, runStatusValue);
  const edgeEvidence = new Map(base.edgeEvidence);
  const traversedEdgeIds = new Set(base.traversedEdgeIds);
  for (const [id, evidence] of inferred) {
    edgeEvidence.set(id, evidence);
    traversedEdgeIds.add(id);
  }
  for (const node of graph.nodes) {
    if (
      node.kind === 'branch-anchor' &&
      graph.edges.some(
        (edge) => edge.target === node.id && traversedEdgeIds.has(edge.id),
      )
    )
      nodeStatus.set(node.id, 'resolved');
  }
  if (
    runStatusValue === 1 &&
    graph.edges.some(
      (edge) => edge.target === 'end' && traversedEdgeIds.has(edge.id),
    )
  )
    nodeStatus.set('end', 'resolved');
  return { nodeStatus, edgeEvidence, traversedEdgeIds };
}

export function inferTransitions(
  graph: WorkflowGraph,
  nodeRuns: readonly WorkflowNodeRunSummary[],
  runStatusValue: number | null = 0,
  _contracts: ReadonlyMap<string, WorkflowNodeVisualContract> = new Map(),
): ReadonlyMap<string, 'persisted' | 'observed' | 'inferred'> {
  const result = new Map<string, 'persisted' | 'observed' | 'inferred'>();
  const byKey = new Map(
    graph.nodes
      .filter((node) => node.workflowNodeKey)
      .map((node) => [node.workflowNodeKey as string, node.id]),
  );
  const ordered = [...nodeRuns].sort(
    (left, right) =>
      String(left.startedAt).localeCompare(String(right.startedAt)) ||
      String(left.id).localeCompare(String(right.id), 'en', { numeric: true }),
  );
  const seenBranchNodes = new Set<string>();
  const transitions = ordered.filter((nodeRun) => {
    const source = byKey.get(nodeRun.nodeKey);
    const branching = source
      ? graph.edges.some(
          (edge) => edge.source === source && edge.kind === 'branch',
        )
      : false;
    if (!branching) return true;
    if (seenBranchNodes.has(nodeRun.nodeKey)) return false;
    seenBranchNodes.add(nodeRun.nodeKey);
    return true;
  });
  const first = transitions[0];
  const firstId = first ? byKey.get(first.nodeKey) : undefined;
  const startEdge = firstId
    ? graph.edges.find(
        (edge) => edge.source === 'start' && edge.target === firstId,
      )
    : undefined;
  if (startEdge) result.set(startEdge.id, 'observed');
  for (let index = 1; index < transitions.length; index += 1) {
    const previous = transitions[index - 1];
    const current = transitions[index];
    const source = byKey.get(previous.nodeKey);
    const target = byKey.get(current.nodeKey);
    if (source && target) {
      const branching = graph.edges.some(
        (edge) => edge.source === source && edge.kind === 'branch',
      );
      const hasBranchEvidence =
        previous.branchKey != null || typeof previous.result === 'boolean';
      const candidates = graph.edges.filter(
        (edge) => edge.source === source && edge.target === target,
      );
      const direct =
        branching && (hasBranchEvidence || candidates.length !== 1)
          ? undefined
          : candidates[0];
      if (direct) result.set(direct.id, 'observed');
    }
  }
  for (const nodeRun of transitions) {
    const source = byKey.get(nodeRun.nodeKey);
    if (!source) continue;
    const graphNode = graph.nodes.find((node) => node.id === source);
    let branchKey = nodeRun.branchKey ?? null;
    if (
      !branchKey &&
      graphNode?.nodeType === 'condition' &&
      typeof nodeRun.result === 'boolean'
    )
      branchKey = nodeRun.result ? 'yes' : 'no';
    if (!branchKey) continue;
    const enter = graph.edges.find(
      (edge) =>
        edge.source === source &&
        edge.branchKey === branchKey &&
        edge.kind === 'branch',
    );
    if (!enter) continue;
    const evidence = nodeRun.branchKey ? 'persisted' : 'inferred';
    result.set(enter.id, evidence);
    let target = enter.target;
    while (
      graph.nodes.find((node) => node.id === target)?.kind === 'branch-anchor'
    ) {
      const exit = graph.edges.find(
        (edge) => edge.source === target && edge.kind === 'main',
      );
      if (!exit) break;
      result.set(exit.id, evidence);
      target = exit.target;
    }
  }
  const last = transitions.at(-1);
  const lastId = last ? byKey.get(last.nodeKey) : undefined;
  if (lastId && runStatusValue === 1) {
    const endEdge = graph.edges.find(
      (edge) =>
        edge.source === lastId && edge.target === 'end' && edge.kind === 'main',
    );
    if (endEdge) result.set(endEdge.id, 'observed');
  }
  return result;
}
