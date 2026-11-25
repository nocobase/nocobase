import {
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ChevronDownIcon, Settings2Icon } from 'lucide-react';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '#components/ui/popover';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import {
  FlowDiagram,
  FlowDiagramStep,
  FlowDiagramTransitionNotes,
  type FlowDiagramProps,
  type FlowDiagramStepKind,
} from '#components/flow-diagram';
import {
  partitionFlowDiagramReturns,
  type FlowDiagramEdge,
  type FlowDiagramNode,
} from '#components/flow-layout';

import {
  lifecycleDiagramGraph,
  lifecycleConfigurationSelection,
  lifecycleNodeConfigurationSelections,
  type LifecycleConfigurationSelection,
  type LifecycleConfigurationTarget,
  type LifecycleDiagramConfiguration,
  type LifecycleDiagramOptions,
} from './lifecycle-diagram-model.js';

export interface LifecycleDiagramProps
  extends
    LifecycleDiagramOptions,
    Omit<
      FlowDiagramProps,
      | 'nodes'
      | 'edges'
      | 'renderNode'
      | 'nodeActions'
      | 'onNodeClick'
      | 'onEdgeClick'
    > {
  readonly description: LifecycleDescription;
  /** Defaults to compact boundary pills and work cards without return wires; pass 'classic' to draw every edge. */
  readonly presentation?: 'classic' | 'process';
  /** Business semantics belong to the caller; unknown intermediate states default to work. */
  readonly stateKind?: (
    state: LifecycleDescription['stateInfo'][number],
  ) => FlowDiagramStepKind;
  /**
   * Final states to omit from the main canvas in process presentation so
   * multi-stage fan-in wires stay off the layout and appear in each source
   * node's hover/focus transition notes. Non-final states are ignored and stay
   * on the main canvas.
   */
  readonly exitStates?:
    | readonly string[]
    | ((state: LifecycleDescription['stateInfo'][number]) => boolean);

  /** Opens the application-owned, authorized parameter editor for declared bindings. */
  readonly configuration?: LifecycleDiagramConfiguration;
  readonly stateActions?: (
    state: LifecycleDescription['stateInfo'][number],
  ) => ReactNode;
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
  currentState,
  endLabel,
  history,
  visitedStates,
  availableTransitions,
  stateLabel,
  transitionLabel,
  renderState,
  stateActions,
  configuration,
  onStateClick,
  onTransitionClick,
  ...props
}: LifecycleDiagramProps): ReactElement {
  const sourceGraph = useMemo(
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
  const graph = configuration
    ? {
        nodes: sourceGraph.nodes.map((node) => ({
          ...node,
          configurable: Boolean(
            lifecycleNodeConfigurationSelections(
              description,
              node.id,
              configuration.canConfigure,
            ).length,
          ),
        })),
        edges: sourceGraph.edges.map((edge) => ({
          ...edge,
          configurable:
            !edge.decorative &&
            Boolean(
              lifecycleConfigurationSelection(
                description,
                {
                  kind: 'transition',
                  name: (JSON.parse(edge.id) as string[])[0],
                },
                configuration.canConfigure,
              ),
            ),
        })),
      }
    : sourceGraph;
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
    const state = description.stateInfo.find((state) => state.name === node.id);
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
        actions: foldedPeerNode ? nodeActions(foldedPeerNode) : undefined,
      };
    });
  };
  const nodeActions = (node: FlowDiagramNode): ReactNode => {
    const state = description.stateInfo.find((state) => state.name === node.id);
    if (!state) return undefined;
    const actions = stateActions?.(state);
    const selections =
      configuration &&
      lifecycleNodeConfigurationSelections(
        description,
        state.name,
        configuration.canConfigure,
      );
    if (!selections?.length || !configuration) return actions;
    return (
      <div className='nodrag nopan flex items-center gap-1'>
        {actions}
        <NodeConfigurationActions
          configuration={configuration}
          selections={selections}
          state={{ kind: 'state', name: state.name }}
          title={(target) => {
            if (target.kind === 'state')
              return stateLabel?.(state) ?? state.title;
            const transition = description.transitions.find(
              (item) => item.name === target.name,
            )!;
            return transitionLabel?.(transition) ?? transition.title;
          }}
        />
      </div>
    );
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
  const displayGraph = process
    ? {
        ...graph,
        nodes: canvasNodes.map((node) => {
          if (node.decorative) return node;
          const kind = kindForNode(node);
          const card = kind === 'work' || kind === 'approval';
          const state = description.stateInfo.find(
            (item) => item.name === node.id,
          );
          const hasActions = Boolean(
            node.configurable || (state && stateActions?.(state)),
          );
          return {
            ...node,
            bare: true,
            width: card ? 240 : hasActions ? 208 : 176,
            height: card ? 80 : nodeDescription?.(node) ? 64 : 44,
            minimapShape: card ? ('card' as const) : ('pill' as const),
          };
        }),
        edges: processEdges,
      }
    : graph;
  return (
    <FlowDiagram
      direction='DOWN'
      initialMinZoom={process ? 0.1 : 0.7}
      compact={process}
      controls={process}
      nodeDescription={nodeDescription}
      autoHeight
      {...props}
      {...displayGraph}
      revealEdges={process ? undefined : props.revealEdges}
      auxiliaryEdges={process ? routes.extraEdges : props.auxiliaryEdges}
      nodeActions={nodeActions}
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
            actions={nodeActions(node)}
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
        if (!transition) return;
        const selection =
          configuration &&
          lifecycleConfigurationSelection(
            description,
            { kind: 'transition', name: transition.name },
            configuration.canConfigure,
          );
        if (selection && configuration) configuration.onConfigure(selection);
        else onTransitionClick?.(transition);
      }}
    />
  );
}

/** Reuse the authoritative editor; this chooser never invents or saves values. */
function NodeConfigurationActions({
  configuration,
  selections,
  state,
  title,
}: {
  readonly configuration: LifecycleDiagramConfiguration;
  readonly selections: readonly LifecycleConfigurationSelection[];
  readonly state: LifecycleConfigurationTarget;
  readonly title: (target: LifecycleConfigurationTarget) => string;
}): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const pendingRef = useRef<LifecycleConfigurationSelection | undefined>(
    undefined,
  );
  const first = selections[0];
  const direct =
    first.target.kind === 'state' || selections.length === 1
      ? first
      : undefined;
  const choices = direct ? selections.slice(1) : selections;
  const label = t('flowDiagram.configure', { defaultValue: 'Configure' });
  const className =
    'shrink-0 border border-primary/15 bg-primary/5 text-primary hover:bg-primary/10';
  return (
    <>
      {direct && (
        <Button
          type='button'
          variant='ghost'
          size='icon-xs'
          className={className}
          aria-label={configuration.label(direct.target)}
          title={configuration.label(direct.target)}
          onClick={(event) => {
            event.stopPropagation();
            configuration.onConfigure(direct);
          }}
        >
          <Settings2Icon aria-hidden />
        </Button>
      )}
      {choices.length > 0 && (
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            if (nextOpen) pendingRef.current = undefined;
            setOpen(nextOpen);
          }}
          onOpenChangeComplete={(nextOpen) => {
            // Open the editor only after the chooser has closed and restored focus.
            // Otherwise its focus restoration can steal focus from the editor.
            if (!nextOpen && pendingRef.current) {
              const selection = pendingRef.current;
              pendingRef.current = undefined;
              configuration.onConfigure(selection);
            }
          }}
        >
          <PopoverTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon-xs'
                className={className}
                aria-label={`${label}: ${title(state)}`}
                title={`${label}: ${title(state)}`}
                onClick={(event) => event.stopPropagation()}
              />
            }
          >
            {direct ? (
              <ChevronDownIcon aria-hidden />
            ) : (
              <Settings2Icon aria-hidden />
            )}
          </PopoverTrigger>
          <PopoverContent
            align='end'
            className='w-auto max-w-[min(var(--container-sm),var(--available-width))]'
            onClick={(event) => event.stopPropagation()}
          >
            <PopoverTitle className='sr-only'>
              {label}: {title(state)}
            </PopoverTitle>
            {choices.map((selection) => (
              <Button
                key={`${selection.target.kind}:${selection.target.name}`}
                type='button'
                variant='ghost'
                className='h-auto justify-start whitespace-normal text-left'
                onClick={() => {
                  pendingRef.current = selection;
                  setOpen(false);
                }}
              >
                {configuration.label(selection.target)} ·{' '}
                {title(selection.target)}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
