/**
 * An App's runtime state as the Apps list shows it: a tag with the runtime alone (a deployment in progress is marked
 * beside it), and why it is in that state — what holds it on its runtime, what its start waits for, its error and its
 * last visit — on hover or focus, and on a tap where there is no hover.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { RuntimeStatus } from '../../shared/releases.js';
import { messageText } from '../lib/errors.js';
import { formatDate } from '../lib/format.js';
import { runtimeReasons, runtimeStateKey } from '../lib/runtime-state.js';
import { Tag, type Tone } from './tag.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

const TONE: Readonly<Record<string, Tone>> = {
  running: 'green',
  pending: 'blue',
  starting: 'blue',
  stopped: 'grey',
  dormant: 'violet',
  waitingCapacity: 'amber',
  waitingMemory: 'amber',
  waitingRecycle: 'amber',
  failed: 'red',
  unknown: 'grey',
};

export function RuntimeStateBadge({
  runtime,
}: {
  readonly runtime: RuntimeStatus;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const [open, setOpen] = useState(false);
  const key = runtimeStateKey(runtime);
  const tag = (
    <Tag tone={TONE[key] ?? 'grey'} dot>
      {t(`ui.state.${key}`)}
    </Tag>
  );
  const reasons = runtimeReasons(runtime).map((reason) => t(reason));
  const details = [
    ...reasons,
    ...(runtime.error ? [messageText(t, runtime.error)] : []),
    ...(runtime.lastAccessedAt
      ? [
          t('ui.runtime.lastVisit', {
            time: formatDate(runtime.lastAccessedAt, i18n.language),
          }),
        ]
      : []),
  ];
  if (details.length === 0) return tag;
  return (
    <Tooltip
      open={open}
      onOpenChange={(next, details) => {
        // A press opens it (below) rather than closing it, so a tap shows it where there is no hover; leaving, a press
        // elsewhere and Escape close it.
        if (details.reason !== 'trigger-press') setOpen(next);
      }}
    >
      <TooltipTrigger
        render={
          <button
            type='button'
            data-slot='runtime-state'
            className='inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring'
            // A tap opens it where there is no hover; on the list it does not open the row.
            onClick={(event) => {
              event.stopPropagation();
              setOpen(true);
            }}
          />
        }
      >
        {tag}
        <span className='sr-only'>{details.join('. ')}</span>
      </TooltipTrigger>
      <TooltipContent className='flex-col items-start gap-0.5' aria-hidden>
        {details.map((line) => (
          <span key={line} className='wrap-anywhere'>
            {line}
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
