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
  presentation = 'classic',
  stateKind,
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
  const routes = process
    ? partitionFlowDiagramReturns(graph)
    : { edges: graph.edges, extraEdges: [] };
  const notesForNode = (id: string) => {
    const nodeOf = (nodeId: string) =>
      graph.nodes.find((node) => node.id === nodeId);
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
      const key = JSON.stringify([name, direction]);
      const group = groups.get(key) ?? { edge, direction, peers: [] };
      groups.set(key, group);
      const peer = direction === 'out' ? edge.target : edge.source;
      if (!group.peers.includes(peer)) group.peers.push(peer);
    }
    return [...groups.values()].map(({ edge, direction, peers }) => {
      const self = labelOf(id);
      const names = peers.map(labelOf);
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
      };
    });
  };
  const kindForNode = (node: FlowDiagramNode): FlowDiagramStepKind => {
    const state = description.stateInfo.find((item) => item.name === node.id);
    return (
      (state && stateKind?.(state)) ??
      (node.kind === 'initial'
        ? 'start'
        : node.kind === 'final'
          ? 'success'
          : 'work')
    );
  };
  // A transition declared from several states draws one edge per source, which
  // would repeat its label beside the target. Label only the edge from the
  // nearest source; the others keep the action as hover text.
  const order = new Map(graph.nodes.map((node, index) => [node.id, index]));
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
    ? graph.nodes.map((node) => {
        if (node.decorative) return node;
        const kind = kindForNode(node);
        const card = kind === 'approval' || kind === 'work';
        return {
          ...node,
          bare: true,
          width: card ? 240 : 176,
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
      renderNode={(node, { active, linked }) => {
        const state = description.stateInfo.find(
          (state) => state.name === node.id,
        );
        const label =
          state && renderState ? renderState(state, node) : node.label;
        if (!process || node.decorative) return label;
        return (
          <FlowDiagramStep
            kind={kindForNode(node)}
            label={label}
            description={nodeDescription?.(node)}
            actions={nodeActions?.(node)}
            linked={linked}
            progress={
              node.highlighted
                ? 'current'
                : node.visited
                  ? 'visited'
                  : history !== undefined ||
                      currentState !== undefined ||
                      visitedStates !== undefined
                    ? 'unreached'
                    : 'plan'
            }
          >
            {active && (
              <FlowDiagramTransitionNotes notes={notesForNode(node.id)} />
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
