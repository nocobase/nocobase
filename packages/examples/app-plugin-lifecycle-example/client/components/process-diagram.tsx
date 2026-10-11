import { useState, type ReactElement } from 'react';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import { useTranslation } from '@nocobase/i18n/client';

import { NAMESPACE } from '../lib/format.js';
import type { LifecycleDiagramHistoryEntry } from './lifecycle-diagram-model.js';
import { LifecycleDiagram } from './lifecycle-diagram.js';

/** The example's translated lifecycle view with inspection and history from the record log. */
export function ProcessDiagram({
  description,
  current,
  visited = [],
  history = [],
  availableTransitions = [],
  className,
}: {
  readonly description: LifecycleDescription;
  readonly current?: string;
  readonly visited?: readonly string[];
  readonly history?: readonly LifecycleDiagramHistoryEntry[];
  readonly availableTransitions?: readonly string[];
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const [selected, setSelected] = useState<{
    kind: 'state' | 'transition';
    name: string;
  }>();
  const state =
    selected?.kind === 'state'
      ? description.stateInfo.find((item) => item.name === selected.name)
      : undefined;
  const transition =
    selected?.kind === 'transition'
      ? description.transitions.find((item) => item.name === selected.name)
      : undefined;
  const stateLabel = (name: string): string =>
    t(`states.${name}`, { defaultValue: name });
  const transitionLabel = (
    item: LifecycleDescription['transitions'][number],
  ): string => {
    const notes: string[] = [];
    if (!item.manual) notes.push('⚙');
    if (
      description.triggers.some((trigger) => trigger.transition === item.name)
    )
      notes.push('⏱');
    if (
      description.continuations.some((effect) => effect.onSuccess === item.name)
    )
      notes.push('✓');
    if (
      description.continuations.some((effect) => effect.onFailure === item.name)
    )
      notes.push('✗');
    return [
      t(`transitions.${item.name}`, { defaultValue: item.title }),
      ...notes,
    ].join(' · ');
  };
  return (
    <div className='space-y-3'>
      {current || history.length || visited.length ? (
        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
          <span className='flex items-center gap-1.5'>
            <span
              className='size-2 rounded-full'
              style={{ background: 'var(--primary)' }}
            />
            {t('diagramStatus.current')}
          </span>
          <span className='flex items-center gap-1.5'>
            <span
              className='size-2 rounded-full'
              style={{
                background:
                  'color-mix(in srgb, var(--primary) 40%, var(--card))',
              }}
            />
            ✓ {t('diagramStatus.visited')}
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='h-0.5 w-4 rounded-full bg-primary' />
            {t('diagramStatus.available')}
          </span>
          <span className='flex items-center gap-1.5'>
            <span className='h-0.5 w-4 rounded-full bg-muted-foreground/65' />
            {t('diagramStatus.pending')}
          </span>
        </div>
      ) : null}
      <LifecycleDiagram
        description={description}
        endLabel={t('diagramStatus.end')}
        currentState={current}
        history={history}
        visitedStates={visited}
        availableTransitions={availableTransitions}
        ariaLabel={t('lifecycle.diagram')}
        direction='DOWN'
        autoHeight
        className={className}
        stateLabel={(item) => stateLabel(item.name)}
        transitionLabel={transitionLabel}
        renderState={(item) => (
          <span className='flex flex-col items-center gap-0.5'>
            <span>{stateLabel(item.name)}</span>
            {item.name === current ? (
              <span className='text-xs'>{t('diagramStatus.current')}</span>
            ) : null}
          </span>
        )}
        onStateClick={(item) => setSelected({ kind: 'state', name: item.name })}
        onTransitionClick={(item) =>
          setSelected({ kind: 'transition', name: item.name })
        }
      />
      {state || transition ? (
        <div
          role='status'
          className='space-y-1 rounded-lg border bg-muted/30 p-3 text-sm'
        >
          <p className='font-medium'>
            {state ? stateLabel(state.name) : transitionLabel(transition!)}
          </p>
          {transition ? (
            <p>
              {transition.from.map(stateLabel).join(', ')} →{' '}
              {transition.to.map(stateLabel).join(', ')}
            </p>
          ) : null}
          <p className='text-muted-foreground'>
            {[
              ...(state
                ? (description.onEnter[state.name] ?? [])
                : (transition?.effects ?? [])),
              ...description.triggers
                .filter((item) =>
                  state
                    ? item.when.includes(state.name)
                    : item.transition === transition?.name,
                )
                .map((item) => `⏱ ${item.name}`),
              ...description.continuations
                .filter(
                  (item) =>
                    transition &&
                    (item.onSuccess === transition.name ||
                      item.onFailure === transition.name),
                )
                .map(
                  (item) =>
                    `${item.onSuccess === transition?.name ? '✓' : '✗'} ${item.effect}`,
                ),
            ].join(' · ')}
          </p>
        </div>
      ) : null}
    </div>
  );
}
