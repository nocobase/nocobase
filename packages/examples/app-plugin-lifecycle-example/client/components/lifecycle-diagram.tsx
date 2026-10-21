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
  const notesForNode = (id: string) =>
    routes.extraEdges
      .filter((edge) => edge.source === id || edge.target === id)
      .map((edge) => ({
        id: edge.id,
        label: edge.label,
        detail: `${graph.nodes.find((node) => node.id === edge.source)?.label ?? edge.source} · ${edge.label ?? ''} → ${graph.nodes.find((node) => node.id === edge.target)?.label ?? edge.target}`,
        kind: kindForNode(graph.nodes.find((node) => node.id === edge.target)!),
      }));
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
      edges={routes.edges}
      revealEdges={process ? undefined : props.revealEdges}
      renderNode={(node, { active }) => {
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
