/** A person who may edit the issue can continue the current suppressed stage action once; the server checks and consumes its token. */
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { TriangleAlertIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { StageRunControl } from './use-stage-run-limit.js';

export function IssueStageRunLimit({
  issue,
  control,
}: {
  readonly issue: IssueDetail;
  readonly control: StageRunControl;
}): ReactElement | null {
  const { t } = useTranslation();
  const blocked = control.pending;
  if (!control.ready || !blocked || blocked.statusKey !== issue.statusKey)
    return null;
  return (
    <Alert>
      <TriangleAlertIcon />
      <AlertTitle>{t('studioAgents.stageRules.limitReached')}</AlertTitle>
      <AlertDescription>
        <p>
          {t('studioAgents.stageRules.continueHint', {
            maxRuns: blocked.maxRuns,
            windowHours: blocked.windowHours,
          })}
        </p>
        <Button
          size='sm'
          disabled={control.submitting}
          onClick={() => control.continueStageRun(blocked.token)}
        >
          {control.submitting ? <Spinner /> : null}
          {t('studioAgents.stageRules.continue')}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function StageRunActivityAction({
  reason,
  token,
  statusKey,
  currentStatusKey,
  control,
}: {
  readonly reason: unknown;
  readonly token: string | null;
  readonly statusKey: string | null;
  readonly currentStatusKey: string;
  readonly control?: StageRunControl;
}): ReactElement | null {
  const { t } = useTranslation();
  const pending = control?.pending;
  if (
    reason !== 'suppressed' ||
    !token ||
    !control?.ready ||
    !pending ||
    statusKey !== currentStatusKey ||
    statusKey !== pending.statusKey ||
    token !== pending.token
  ) {
    return null;
  }
  return (
    <Button
      size='sm'
      variant='outline'
      className='h-7 px-2 text-xs'
      disabled={control.submitting}
      onClick={() => control.continueStageRun(pending.token)}
    >
      {control.submitting ? <Spinner /> : null}
      {t('studioAgents.stageRules.continue')}
    </Button>
  );
}
