import type { LifecycleDescription } from '@nocobase/lifecycle';
import type { FlowDiagramGraph } from '#components/flow-layout';

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

export type LifecycleConfigurationTarget =
  | { readonly kind: 'state'; readonly name: string }
  | { readonly kind: 'transition'; readonly name: string };
export type LifecycleParameterGroup = NonNullable<
  LifecycleDescription['parameterConfiguration']
>['groups'][number];
export type LifecycleParameterField = LifecycleParameterGroup['fields'][string];
export interface LifecycleConfigurationSelection {
  readonly target: LifecycleConfigurationTarget;
  /** Only bound, authorized fields. Editors must merge into a complete group before saving. */
  readonly groups: readonly LifecycleParameterGroup[];
}
export interface LifecycleDiagramConfiguration {
  readonly label: (target: LifecycleConfigurationTarget) => string;
  /** UI affordance only: the server must independently authorize reads and writes. */
  readonly canConfigure: (
    group: LifecycleParameterGroup,
    field: string,
    definition: LifecycleParameterField,
  ) => boolean;
  readonly onConfigure: (selection: LifecycleConfigurationSelection) => void;
}

/** Selects declared bindings only; never guesses parameters from node names or labels. */
export function lifecycleConfigurationSelection(
  description: LifecycleDescription,
  target: LifecycleConfigurationTarget,
  canConfigure: LifecycleDiagramConfiguration['canConfigure'],
): LifecycleConfigurationSelection | undefined {
  const exists =
    target.kind === 'state'
      ? description.stateInfo.some((state) => state.name === target.name)
      : description.transitions.some(
          (transition) => transition.name === target.name,
        );
  if (!exists) return undefined;
  const groups = (description.parameterConfiguration?.groups ?? []).flatMap(
    (group) => {
      const fields = Object.fromEntries(
        Object.entries(group.fields).filter(
          ([key, field]) =>
            field.bindings?.some(
              (binding) => binding[target.kind] === target.name,
            ) && canConfigure(group, key, field),
        ),
      );
      return Object.keys(fields).length ? [{ ...group, fields }] : [];
    },
  );
  return groups.length ? { target, groups } : undefined;
}

/** Surface an outgoing transition's declared policy on its owning node as well. */
export function lifecycleNodeConfigurationSelections(
  description: LifecycleDescription,
  state: string,
  canConfigure: LifecycleDiagramConfiguration['canConfigure'],
): readonly LifecycleConfigurationSelection[] {
  if (!description.stateInfo.some((item) => item.name === state)) return [];
  const own = lifecycleConfigurationSelection(
    description,
    { kind: 'state', name: state },
    canConfigure,
  );
  const covered = new Set(
    own?.groups.flatMap((group) =>
      Object.keys(group.fields).map((field) =>
        JSON.stringify([group.key, field]),
      ),
    ),
  );
  const outgoing = description.transitions.flatMap((transition) => {
    if (!transition.from.includes(state)) return [];
    const selection = lifecycleConfigurationSelection(
      description,
      { kind: 'transition', name: transition.name },
      canConfigure,
    );
    // A dual state/transition binding already has an entry on this node. Keep
    // distinct transitions distinct, even when they happen to share fields.
    return selection?.groups.some((group) =>
      Object.keys(group.fields).some(
        (field) => !covered.has(JSON.stringify([group.key, field])),
      ),
    )
      ? [selection]
      : [];
  });
  return own ? [own, ...outgoing] : outgoing;
}
