import type { LifecycleDescription } from '@nocobase/lifecycle';
import type { FlowDiagramGraph } from './flow-layout.js';

export interface LifecycleDiagramHistoryEntry {
  readonly transition: string;
  readonly from: string | null;
  readonly to: string;
}

export interface LifecycleDiagramOptions {
  /** Localized label for separate end markers; omitted to hide them. */
  readonly endLabel?: string;
  readonly history?: readonly LifecycleDiagramHistoryEntry[];
  readonly visitedStates?: readonly string[];
  readonly currentState?: string;
  /** Names from view.available filtered by the caller to transitions actually available. */
  readonly availableTransitions?: readonly string[];
  readonly stateLabel?: (
    state: LifecycleDescription['stateInfo'][number],
  ) => string;
  readonly transitionLabel?: (
    transition: LifecycleDescription['transitions'][number],
  ) => string;
}

/** Builds edges for every declared source/destination pair; it never infers a record's history. */
export function lifecycleDiagramGraph(
  description: LifecycleDescription,
  options: LifecycleDiagramOptions = {},
): FlowDiagramGraph {
  const history = options.history ?? [];
  const visitedStates = new Set([
    ...(options.visitedStates ?? []),
    ...history.flatMap((entry) =>
      entry.from === null ? [entry.to] : [entry.from, entry.to],
    ),
  ]);
  const visitedEdges = new Set(
    history
      .filter((entry) => entry.from !== null)
      .map((entry) => JSON.stringify([entry.transition, entry.from, entry.to])),
  );
  const graph: FlowDiagramGraph = {
    nodes: description.stateInfo.map((state) => ({
      id: state.name,
      width: 232,
      height: 104,
      label: options.stateLabel?.(state) ?? state.title,
      configurable: (description.parameterConfiguration?.groups ?? []).some(
        (group) =>
          Object.values(group.fields).some((field) =>
            field.bindings?.some((binding) => binding.state === state.name),
          ),
      ),
      visited: visitedStates.has(state.name),
      highlighted: state.name === options.currentState,
      kind: state.final
        ? 'final'
        : description.initialStates.includes(state.name)
          ? 'initial'
          : 'state',
    })),
    edges: description.transitions.flatMap((transition) =>
      transition.from.flatMap((source) =>
        transition.to.map((target) => ({
          id: JSON.stringify([transition.name, source, target]),
          source,
          target,
          label: options.transitionLabel?.(transition) ?? transition.title,
          configurable: (description.parameterConfiguration?.groups ?? []).some(
            (group) =>
              Object.values(group.fields).some((field) =>
                field.bindings?.some(
                  (binding) => binding.transition === transition.name,
                ),
              ),
          ),
          visited: visitedEdges.has(
            JSON.stringify([transition.name, source, target]),
          ),
          highlighted:
            source === options.currentState &&
            (options.availableTransitions?.includes(transition.name) ?? false),
        })),
      ),
    ),
  };
  if (!options.endLabel) return graph;
  const ids = new Set(graph.nodes.map((node) => node.id));
  const endings = description.stateInfo
    .filter((state) => state.final)
    .map((state) => {
      let id = JSON.stringify(['$end', state.name]);
      while (ids.has(id)) id += ':';
      ids.add(id);
      return { state, id };
    });
  return {
    nodes: [
      ...graph.nodes,
      ...endings.map(({ state, id }) => ({
        id,
        label: `◎ ${options.endLabel}`,
        // Compact fixed canvas dimensions for a terminal annotation.
        width: 88,
        height: 32,
        decorative: true,
        visited:
          state.name === options.currentState || visitedStates.has(state.name),
        className:
          'rounded-full border-0 bg-transparent text-muted-foreground shadow-none',
      })),
    ],
    edges: [
      ...graph.edges,
      ...endings.map(({ state, id }) => ({
        id: JSON.stringify(['$end', state.name]),
        source: state.name,
        target: id,
        decorative: true,
        visited:
          state.name === options.currentState || visitedStates.has(state.name),
      })),
    ],
  };
}
