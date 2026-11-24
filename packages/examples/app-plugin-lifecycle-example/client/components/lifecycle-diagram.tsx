import { useMemo, type ReactElement, type ReactNode } from 'react';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import {
  FlowDiagram,
  FlowDiagramStep,
  FlowDiagramTransitionNotes,
  type FlowDiagramStepKind,
  type FlowDiagramProps,
} from '#components/flow-diagram';
import {
  partitionFlowDiagramReturns,
  type FlowDiagramEdge,
  type FlowDiagramNode,
} from '#components/flow-layout';

import {
  lifecycleDiagramGraph,
  type LifecycleDiagramOptions,
} from './lifecycle-diagram-model.js';

export interface LifecycleDiagramProps
  extends
    LifecycleDiagramOptions,
    Omit<
      FlowDiagramProps,
      'nodes' | 'edges' | 'renderNode' | 'onNodeClick' | 'onEdgeClick'
    > {
  readonly description: LifecycleDescription;
  readonly presentation?: 'classic' | 'process';
  readonly stateKind?: (
    state: LifecycleDescription['stateInfo'][number],
  ) => FlowDiagramStepKind;
  readonly exitStates?:
    | readonly string[]
    | ((state: LifecycleDescription['stateInfo'][number]) => boolean);

  readonly renderState?: (
    state: LifecycleDescription['stateInfo'][number],
    node: FlowDiagramNode,
  ) => ReactNode;
  readonly onStateClick?: (
    state: LifecycleDescription['stateInfo'][number],
  ) => void;
  readonly onTransitionClick?: (
    transition: LifecycleDescription['transitions'][number],
  ) => void;
}

/** Definitions are source-owned; clicking opens consumer-owned details, never fires a transition. */
export function LifecycleDiagram({
  description,
  presentation = 'process',
  stateKind,
  exitStates,
  nodeDescription,
  nodeActions,
  currentState,
  endLabel,
  history,
  visitedStates,
  availableTransitions,
  stateLabel,
  transitionLabel,
  renderState,
  onStateClick,
  onTransitionClick,
  ...props
}: LifecycleDiagramProps): ReactElement {
  const graph = useMemo(
    () =>
      lifecycleDiagramGraph(description, {
        currentState,
        endLabel,
        history,
        visitedStates,
        availableTransitions,
        stateLabel,
        transitionLabel,
      }),
    [
      description,
      currentState,
      endLabel,
      history,
      visitedStates,
      availableTransitions,
      stateLabel,
      transitionLabel,
    ],
  );
  const process = presentation === 'process';
  const order = new Map(graph.nodes.map((node, index) => [node.id, index]));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const candidateFoldedExitIds = useMemo(() => {
    if (!process || !exitStates) return new Set<string>();
    const match =
      typeof exitStates === 'function'
        ? exitStates
        : (state: LifecycleDescription['stateInfo'][number]) =>
            exitStates.includes(state.name);
    return new Set(
      description.stateInfo
        .filter((state) => state.final && match(state))
        .map((state) => state.name),
    );
  }, [process, exitStates, description.stateInfo]);
  const kindForNode = (node: FlowDiagramNode): FlowDiagramStepKind => {
    const state = description.stateInfo.find((item) => item.name === node.id);
    return (
      (state && stateKind?.(state)) ??
      (node.kind === 'initial'
        ? 'start'
        : node.kind === 'final'
          ? candidateFoldedExitIds.has(node.id)
            ? 'negative'
            : 'success'
          : 'work')
    );
  };
  const terminatedAt = (() => {
    if (!process || !currentState || !candidateFoldedExitIds.has(currentState))
      return undefined;
    if (!history?.length) return undefined;
    for (let index = history.length - 1; index >= 0; index--) {
      const entry = history[index];
      if (
        entry.to === currentState &&
        entry.from !== null &&
        nodeById.has(entry.from) &&
        !candidateFoldedExitIds.has(entry.from)
      ) {
        return entry.from;
      }
    }
    return undefined;
  })();
  // If execution is in a folded exit state without history identifying a canvas
  // source node, keep that active final state on the canvas so current status stays visible.
  const foldedExitIds = (() => {
    if (!currentState || !candidateFoldedExitIds.has(currentState))
      return candidateFoldedExitIds;
    if (terminatedAt) return candidateFoldedExitIds;
    const next = new Set(candidateFoldedExitIds);
    next.delete(currentState);
    return next;
  })();
  const foldedDecorativeNodeIds = new Set(
    graph.edges
      .filter((edge) => edge.decorative && foldedExitIds.has(edge.source))
      .map((edge) => edge.target),
  );
  const hiddenNodeIds = new Set([...foldedExitIds, ...foldedDecorativeNodeIds]);
  const canvasNodes = graph.nodes.filter((node) => !hiddenNodeIds.has(node.id));
  const canvasNodeIds = new Set(canvasNodes.map((node) => node.id));
  const routes = (() => {
    if (!process) return { edges: graph.edges, extraEdges: [] };
    const exitEdges: FlowDiagramEdge[] = [];
    const remainingEdges: FlowDiagramEdge[] = [];
    for (const edge of graph.edges) {
      if (hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target)) {
        if (
          !edge.decorative &&
          canvasNodeIds.has(edge.source) &&
          foldedExitIds.has(edge.target)
        ) {
          exitEdges.push(edge);
        }
        continue;
      }
      remainingEdges.push(edge);
    }
    const partitioned = partitionFlowDiagramReturns({
      nodes: canvasNodes,
      edges: remainingEdges,
    });
    return {
      edges: partitioned.edges,
      extraEdges: [...partitioned.extraEdges, ...exitEdges],
    };
  })();
  const terminatedExitNode =
    terminatedAt && currentState ? nodeById.get(currentState) : undefined;
  const terminatedExitState =
    terminatedAt && currentState
      ? description.stateInfo.find((item) => item.name === currentState)
      : undefined;
  const terminatedOutcome = terminatedExitNode
    ? {
        label:
          terminatedExitState && renderState
            ? renderState(terminatedExitState, terminatedExitNode)
            : terminatedExitNode.label,
        kind: kindForNode(terminatedExitNode),
      }
    : undefined;
  const hasExecutionContext =
    history !== undefined ||
    currentState !== undefined ||
    visitedStates !== undefined;
  const notesForNode = (id: string) => {
    const nodeOf = (nodeId: string) => nodeById.get(nodeId);
    const labelOf = (nodeId: string) => nodeOf(nodeId)?.label ?? nodeId;
    // A transition with several sources or targets becomes one edge per pair;
    // list it once per direction with every state at the other end.
    const groups = new Map<
      string,
      { edge: FlowDiagramEdge; direction: 'out' | 'in'; peers: string[] }
    >();
    for (const edge of routes.extraEdges) {
      const direction =
        edge.source === id ? 'out' : edge.target === id ? 'in' : undefined;
      if (!direction) continue;
      const [name] = JSON.parse(edge.id) as string[];
      const peer = direction === 'out' ? edge.target : edge.source;
      // Keep each folded exit target as its own interactive entry so every
      // off-canvas outcome retains its tone, click inspection and actions.
      const key =
        direction === 'out' && foldedExitIds.has(peer)
          ? JSON.stringify([name, direction, peer])
          : JSON.stringify([name, direction]);
      const group = groups.get(key) ?? { edge, direction, peers: [] };
      groups.set(key, group);
      if (!group.peers.includes(peer)) group.peers.push(peer);
    }
    return [...groups.values()].map(({ edge, direction, peers }) => {
      const self = labelOf(id);
      const names = peers.map(labelOf);
      const foldedPeerId =
        direction === 'out' && peers.length === 1 && foldedExitIds.has(peers[0])
          ? peers[0]
          : undefined;
      const foldedPeerState = foldedPeerId
        ? description.stateInfo.find((item) => item.name === foldedPeerId)
        : undefined;
      const foldedPeerNode = foldedPeerId ? nodeOf(foldedPeerId) : undefined;
      return {
        id: `${direction}:${edge.id}`,
        label: edge.label,
        direction,
        peers: names,
        detail:
          direction === 'out'
            ? `${self} · ${edge.label ?? ''} → ${names.join(', ')}`
            : `${names.join(', ')} · ${edge.label ?? ''} → ${self}`,
        kind: kindForNode(nodeOf(peers[0])!),
        onClick:
          foldedPeerState && onStateClick
            ? () => onStateClick(foldedPeerState)
            : undefined,
        actions: foldedPeerNode ? nodeActions?.(foldedPeerNode) : undefined,
      };
    });
  };
  // A transition declared from several states draws one edge per source, which
  // would repeat its label beside the target. Label only the edge from the
  // nearest source; the others keep the action as hover text.
  const labelledEdges = new Map<string, FlowDiagramEdge>();
  for (const edge of routes.edges) {
    if (edge.decorative) continue;
    const [name] = JSON.parse(edge.id) as string[];
    const key = JSON.stringify([name, edge.target]);
    const current = labelledEdges.get(key);
    if (!current || order.get(edge.source)! > order.get(current.source)!)
      labelledEdges.set(key, edge);
  }
  const processEdges = routes.edges.map((edge) =>
    edge.decorative || [...labelledEdges.values()].includes(edge)
      ? { ...edge, title: edge.label }
      : { ...edge, title: edge.label, label: undefined, configurable: false },
  );
  const nodes = process
    ? canvasNodes.map((node) => {
        if (node.decorative) return node;
        const kind = kindForNode(node);
        const card = kind === 'approval' || kind === 'work';
        const hasActions = Boolean(nodeActions?.(node));
        return {
          ...node,
          bare: true,
          width: card ? 240 : hasActions ? 208 : 176,
          height: card ? 80 : nodeDescription?.(node) ? 64 : 44,
          minimapShape: card ? ('card' as const) : ('pill' as const),
        };
      })
    : graph.nodes;
  return (
    <FlowDiagram
      direction='DOWN'
      compact={process}
      controls={process}
      nodeActions={nodeActions}
      nodeDescription={nodeDescription}
      autoHeight
      {...props}
      {...graph}
      nodes={nodes}
      edges={process ? processEdges : routes.edges}
      revealEdges={process ? undefined : props.revealEdges}
      auxiliaryEdges={process ? routes.extraEdges : props.auxiliaryEdges}
      renderNode={(node, { active, linked, noteSide }) => {
        const state = description.stateInfo.find(
          (state) => state.name === node.id,
        );
        const label =
          state && renderState ? renderState(state, node) : node.label;
        if (!process || node.decorative) return label;
        const isTerminatedHere = node.id === terminatedAt;
        return (
          <FlowDiagramStep
            kind={kindForNode(node)}
            label={label}
            description={nodeDescription?.(node)}
            actions={nodeActions?.(node)}
            linked={linked}
            outcome={isTerminatedHere ? terminatedOutcome : undefined}
            progress={
              isTerminatedHere || node.highlighted
                ? 'current'
                : node.visited
                  ? 'visited'
                  : hasExecutionContext
                    ? 'unreached'
                    : 'plan'
            }
          >
            {active && (
              <FlowDiagramTransitionNotes
                notes={notesForNode(node.id)}
                side={noteSide}
              />
            )}
          </FlowDiagramStep>
        );
      }}
      onNodeClick={(node) => {
        const state = description.stateInfo.find(
          (state) => state.name === node.id,
        );
        if (state) onStateClick?.(state);
      }}
      onEdgeClick={(edge) => {
        if (edge.decorative) return;
        const [name] = JSON.parse(edge.id) as string[];
        const transition = description.transitions.find(
          (item) => item.name === name,
        );
        if (transition) onTransitionClick?.(transition);
      }}
    />
  );
}
