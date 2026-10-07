import { useTranslation } from '@nocobase/i18n/client';
import { AlertTriangleIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import type { Priority } from '../../shared/common.js';
import type { StatusDefinition } from '../../shared/issues.js';
import { useKindLabel } from '../lib/kinds.js';
import { PRIORITY_TONE, statusName, statusTone } from '../lib/status.js';
import { cn } from 'cn';
import { PmKindIcon } from './pm-kind-icon.js';
import { PmTag } from './pm-tag.js';
import { PM_OTHER_KIND_CLASS, PM_OTHER_KIND_TEXT_CLASS } from './pm-tones.js';
import { Avatar, AvatarFallback } from './ui/avatar.js';

/** An issue status: a tag with a dot in the status's tone and its name. */
export function PmStatusBadge({
  statusKey,
  statuses,
  className,
}: {
  readonly statusKey: string;
  /** The issue's workflow; without it, the status shows by its key. */
  readonly statuses?: readonly StatusDefinition[];
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <PmTag
      tone={statusTone(statuses, statusKey)}
      dot
      data-status={statusKey}
      className={className}
    >
      {statusName(t, statuses, statusKey)}
    </PmTag>
  );
}

/**
 * A priority: a tag (urgent red, high orange, medium blue, low grey); no priority is a muted dash, with the word kept
 * for screen readers, so the tags that do show stand out.
 */
export function PmPriorityLabel({
  priority,
  className,
}: {
  readonly priority: Priority;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  if (priority === 'none')
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>
        —<span className='sr-only'>{t('priority.none')}</span>
      </span>
    );
  return (
    <PmTag
      tone={PRIORITY_TONE[priority]}
      data-priority={priority}
      className={className}
      icon={
        priority === 'urgent' ? <AlertTriangleIcon aria-hidden='true' /> : null
      }
    >
      {t(`priority.${priority}`)}
    </PmTag>
  );
}

/** A small pulsing dot marking work in progress; decorative, the surrounding text carries the meaning. */
export function PmPulse({
  className,
  inherit = false,
}: {
  readonly className?: string;
  /** Pulse in the surrounding text colour (inside a tag) instead of the primary colour. */
  readonly inherit?: boolean;
}): ReactElement {
  const fill = inherit ? 'bg-current' : 'bg-primary';
  return (
    <span
      className={cn('relative flex size-2 shrink-0', className)}
      aria-hidden='true'
    >
      <span
        className={cn(
          'absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none',
          fill,
        )}
      />
      <span className={cn('relative inline-flex size-2 rounded-full', fill)} />
    </span>
  );
}

/**
 * Who executes an issue: a person, nobody, or a principal of another registered kind (marked with the kind's name). A
 * long name truncates to the space it is given and shows in full on hover.
 */
export function PmExecutor({
  type,
  name,
}: {
  /** A kind's key; null for nobody. */
  readonly type: string | null;
  readonly name?: string | null;
}): ReactElement {
  const { t } = useTranslation();
  const kindLabel = useKindLabel();
  if (type === null || !name)
    return (
      <span className='text-sm text-muted-foreground'>
        —
        {type === null ? (
          <span className='sr-only'>{t('executor.none')}</span>
        ) : null}
      </span>
    );
  return (
    <span
      className='inline-flex max-w-full min-w-0 items-center gap-1.5 text-sm'
      title={name}
    >
      {type === 'user' ? null : (
        <Avatar
          size='sm'
          aria-hidden='true'
          className={cn(
            'size-4',
            type === 'system'
              ? 'after:border-dashed after:border-muted-foreground/50'
              : 'rounded-md after:rounded-md',
          )}
        >
          <AvatarFallback
            className={
              type === 'system'
                ? 'bg-transparent text-muted-foreground'
                : `rounded-md ${PM_OTHER_KIND_CLASS}`
            }
          >
            <PmKindIcon kind={type} className='size-2.5' />
          </AvatarFallback>
        </Avatar>
      )}
      <span className='truncate'>{name}</span>
      {type !== 'user' ? (
        <span className={cn('shrink-0 text-xs', PM_OTHER_KIND_TEXT_CLASS)}>
          {kindLabel(type)}
        </span>
      ) : null}
    </span>
  );
}
