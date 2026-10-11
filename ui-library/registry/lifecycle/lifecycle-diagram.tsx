import { useMemo, type ReactElement, type ReactNode } from 'react';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import { FlowDiagram, type FlowDiagramProps } from '#components/flow-diagram';
import type { FlowDiagramNode } from '#components/flow-layout';

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
  return (
    <FlowDiagram
      {...props}
      {...graph}
      renderNode={(node) => {
        const state = description.stateInfo.find(
          (state) => state.name === node.id,
        );
        return state && renderState ? renderState(state, node) : node.label;
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
