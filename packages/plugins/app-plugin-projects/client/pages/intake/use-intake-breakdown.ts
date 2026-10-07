import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { ACCESS_NAMESPACE } from '../../../shared/access.js';
import { useNotify } from '../../hooks/use-notify.js';
import { planKeys, usePlanApi } from '../../kit/plans/api.js';
import { INTAKE_JOB_PARAM, useIntakeAiAvailability } from './use-intake-ai.js';

export interface IntakeBreakdown {
  /** The viewer can ask AI. */
  readonly available: boolean;
  readonly starting: boolean;
  /** Asks AI to split the issue into sub-issue drafts and opens them in the New sub-issue dialog's AI tab. */
  readonly start: () => Promise<void>;
}

/**
 * "Break into sub-issues", as the old NocoProject had it: AI splits the issue into sub-issue drafts
 * (`shared/intake-ai.ts`, `breakdown`), which open in the New sub-issue dialog's AI tab over the issue's page
 * (`new-subtask?tab=ai&job=`, relative to the page's route) to be edited and created. `open` replaces that step, for
 * the dialog itself, which follows the request in place.
 */
export function useIntakeBreakdown(
  issueId: string,
  open?: (jobId: string) => void,
): IntakeBreakdown {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const plans = usePlanApi();
  const notify = useNotify();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const availability = useIntakeAiAvailability();
  const [starting, setStarting] = useState(false);
  return {
    available: availability?.available === true,
    starting,
    start: async () => {
      setStarting(true);
      try {
        const job = await plans.startIntakeAi({ mode: 'breakdown', issueId });
        queryClient.setQueryData(planKeys.intakeJob(job.id), job);
        if (open) open(job.id);
        else
          void navigate({
            pathname: 'new-subtask',
            search: `?tab=ai&${INTAKE_JOB_PARAM}=${encodeURIComponent(job.id)}`,
          });
      } catch (error) {
        notify.error(error, t('intakeAi.startFailed'));
      } finally {
        setStarting(false);
      }
    },
  };
}
