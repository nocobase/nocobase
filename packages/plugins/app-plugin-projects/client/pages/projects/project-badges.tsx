import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import type { ProjectStatus } from '../../../shared/projects.js';
import { PmProgressRing } from '../../components/pm-live.js';
import { PmTag } from '../../components/pm-tag.js';
import { projectStatusSuffix, projectStatusTone } from './progress.js';

/** A project's status: the same tag as an issue status. */
export function ProjectStatusBadge({
  status,
}: {
  readonly status: ProjectStatus;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <PmTag tone={projectStatusTone(status)} dot data-status={status}>
      {t(`projectStatus.${projectStatusSuffix(status)}`)}
    </PmTag>
  );
}

/** Progress in a list row: a small ring, "done/total" and the percentage. */
export function ProjectProgressBar({
  done,
  total,
  percent,
  label,
}: {
  readonly done: number;
  readonly total: number;
  readonly percent: number;
  readonly label: string;
}): ReactElement {
  return (
    <div
      className='flex min-w-24 items-center gap-2'
      role='img'
      aria-label={label}
    >
      <PmProgressRing percent={percent} size={18} showValue={false} />
      <span className='text-xs text-muted-foreground tabular-nums'>
        {done}/{total}
      </span>
      <span className='text-xs text-muted-foreground tabular-nums'>
        {percent}%
      </span>
    </div>
  );
}
