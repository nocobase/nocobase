/** The actions of a suggested executor's card (`suggestions.ts`): accept, dismiss. */
import { ApiClientError } from '@nocobase/app-client';
import {
  PlanApi,
  planKeys,
  usePlanApi,
} from '@nocobase/app-plugin-projects/client/kit';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { useNotify } from '../../access/notify.js';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import type { InboxPartProps } from '@/extensions/nocobase-inbox/registry';
import type { ProjectsModel } from './projects.js';
import { useSuggestionPlan } from './suggestions-plan.js';

/** Accepts the suggestion: the plan is checked again when it went out of date, then executed. */
async function accept(api: PlanApi, plan: Plan): Promise<Plan> {
  const ready =
    plan.status === 'pending'
      ? plan
      : await api.act(plan.id, 'retry', plan.revision);
  return api.act(ready.id, 'execute', ready.revision);
}

export function SuggestionActions({
  entry,
  onDecided,
}: InboxPartProps<ProjectsModel>): ReactElement {
  const { t } = useTranslation();
  const api = usePlanApi();
  const query = useSuggestionPlan(entry);
  const notify = useNotify();
  const queryClient = useQueryClient();
  const decide = useMutation({
    mutationFn: async (action: 'accept' | 'dismiss') => {
      const plan = query.data;
      if (!plan) throw new Error('The suggestion is not loaded.');
      return action === 'accept'
        ? accept(api, plan)
        : api.act(plan.id, 'void', plan.revision);
    },
    onSuccess: (plan, action) => {
      if (action === 'accept' && plan.status !== 'executed')
        notify.error(null, t('inbox.suggestion.failed'));
      else notify.success(t(`inbox.suggestion.done.${action}`));
      onDecided();
    },
    onError: (error) =>
      error instanceof ApiClientError && error.status === 409
        ? notify.error(null, t('inbox.suggestion.gone'))
        : notify.error(error),
    onSettled: () => {
      for (const queryKey of [
        inboxKeys.all,
        planKeys.all,
        ['pm', 'issue'],
        ['pm', 'issues'],
      ])
        void queryClient.invalidateQueries({ queryKey });
    },
  });
  const pending = decide.isPending ? decide.variables : null;
  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button
        disabled={decide.isPending}
        data-action='accept'
        onClick={() => decide.mutate('accept')}
      >
        {pending === 'accept' ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <CheckIcon data-icon='inline-start' />
        )}
        {t('inbox.suggestion.accept')}
      </Button>
      <Button
        variant='outline'
        disabled={decide.isPending}
        data-action='dismiss'
        onClick={() => decide.mutate('dismiss')}
      >
        {pending === 'dismiss' ? <Spinner data-icon='inline-start' /> : null}
        {t('inbox.suggestion.dismiss')}
      </Button>
    </div>
  );
}
