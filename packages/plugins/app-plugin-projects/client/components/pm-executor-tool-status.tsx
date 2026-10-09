import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import type { Executor } from '../../shared/issues.js';
import { useExecutorTools } from '../hooks/use-executor-tools.js';

export function PmExecutorToolStatus({
  executor,
}: {
  readonly executor: Executor | null;
}): ReactElement | null {
  const { t } = useTranslation();
  const state = useExecutorTools(executor);
  if (!executor || state.tools.length === 0) return null;
  const status = state.error
    ? t('executor.checkFailed')
    : !state.selected
      ? t('executor.chooseTool')
      : state.loading && !state.availability
        ? t('executor.checking')
        : state.availability?.status === 'available'
          ? state.availability.runnerName
            ? t('executor.availableOn', { name: state.availability.runnerName })
            : t('executor.available')
          : (state.availability?.reason ?? t('executor.unavailable'));
  return (
    <p className='text-xs text-muted-foreground' role='status'>
      {[state.selected?.model, status].filter(Boolean).join(' · ')}
    </p>
  );
}
