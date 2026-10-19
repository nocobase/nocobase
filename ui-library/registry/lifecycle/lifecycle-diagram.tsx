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
import { FlowDiagram, type FlowDiagramProps } from '#components/flow-diagram';
import type { FlowDiagramNode } from '#components/flow-layout';

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
  return (
    <FlowDiagram
      direction='DOWN'
      initialMinZoom={0.7}
      autoHeight
      {...props}
      {...graph}
      nodeActions={(node) => {
        const state = description.stateInfo.find(
          (state) => state.name === node.id,
        );
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
      }}
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
