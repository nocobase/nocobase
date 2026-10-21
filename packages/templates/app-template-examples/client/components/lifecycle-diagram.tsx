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
  /** Opt into compact boundary pills and work cards; the classic presentation remains the default. */
  readonly presentation?: 'classic' | 'process';
  /** Business semantics belong to the caller; unknown intermediate states default to work. */
  readonly stateKind?: (
    state: LifecycleDescription['stateInfo'][number],
  ) => FlowDiagramStepKind;

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
  presentation = 'classic',
  stateKind,
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
    const state = description.stateInfo.find((state) => state.name === node.id);
    return (
      (state && stateKind?.(state)) ??
      (node.kind === 'initial'
        ? 'start'
        : node.kind === 'final'
          ? 'success'
          : 'work')
    );
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
  const displayGraph = process
    ? {
        ...graph,
        nodes: graph.nodes.map((node) => {
          if (node.decorative) return node;
          const kind = kindForNode(node);
          const card = kind === 'work' || kind === 'approval';
          return {
            ...node,
            bare: true,
            width: card ? 240 : 176,
            height: card ? 80 : nodeDescription?.(node) ? 64 : 44,
            minimapShape: card ? ('card' as const) : ('pill' as const),
          };
        }),
        edges: routes.edges.map((edge) => ({ ...edge, title: edge.label })),
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
      nodeActions={nodeActions}
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
            actions={nodeActions(node)}
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
    'h-6 border border-primary/15 bg-primary/5 px-1.5 text-xs text-primary hover:bg-primary/10';
  return (
    <>
      {direct && (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className={className}
          onClick={(event) => {
            event.stopPropagation();
            configuration.onConfigure(direct);
          }}
        >
          <Settings2Icon aria-hidden />
          {configuration.label(direct.target)}
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
                size='sm'
                className={className}
                aria-label={`${label}: ${title(state)}`}
                onClick={(event) => event.stopPropagation()}
              />
            }
          >
            {!direct && (
              <>
                <Settings2Icon aria-hidden />
                {label}
              </>
            )}
            <ChevronDownIcon aria-hidden />
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
