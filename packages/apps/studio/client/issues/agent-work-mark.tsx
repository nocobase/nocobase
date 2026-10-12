import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Spinner } from '../components/ui/spinner.js';

/** A passive mark: card clicks, dragging and table operations keep their existing handlers. */
export function AgentWorkMark({
  name,
}: {
  readonly name: string;
}): ReactElement {
  const { t } = useTranslation();
  const label = t('issuesPage.agentWorking');
  return (
    <span
      role='status'
      aria-label={t('issuesPage.agentWorkingBy', { name })}
      title={t('issuesPage.agentWorkingBy', { name })}
      className='inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-primary'
    >
      <Spinner
        aria-hidden='true'
        role='presentation'
        aria-label={undefined}
        className='size-3 motion-reduce:animate-none'
      />
      {label}
    </span>
  );
}
