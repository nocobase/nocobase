/** Actions inside the shared Needs you card or Now row, using the existing run request API. */
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useNotify } from '../../access/notify.js';
import type { PersonalRunnerRequest } from '../../../shared/project-manager.js';

export function PersonalRunnerActions({
  request,
}: {
  readonly request: PersonalRunnerRequest;
}): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const notify = useNotify();
  const client = useQueryClient();
  const action = useMutation({
    mutationFn: (operation: 'confirm' | 'reject' | 'runAsMe') =>
      api.request({
        method: 'POST',
        path: `agents/runRequests/${encodeURIComponent(request.id)}/${operation}`,
        ...(operation === 'reject' ? { json: {} } : {}),
      }),
    onError: (error) =>
      notify.error(error, t('issueLive.personalRunner.failed')),
    onSettled: async () => {
      await Promise.all(
        [
          ['studio', 'issueProgress'],
          ['pm', 'issue'],
          ['pm', 'issues', 'followUps'],
        ].map((queryKey) => client.invalidateQueries({ queryKey })),
      );
    },
  });
  return (
    <span className='flex flex-wrap items-center gap-2'>
      {request.canDecide ? (
        <>
          <Button
            size='sm'
            disabled={action.isPending}
            onClick={() => action.mutate('confirm')}
          >
            {action.isPending ? <Spinner /> : null}
            {t('issueLive.personalRunner.confirm')}
          </Button>
          <Button
            size='sm'
            variant='outline'
            disabled={action.isPending}
            onClick={() => action.mutate('reject')}
          >
            {t('issueLive.personalRunner.reject')}
          </Button>
        </>
      ) : null}
      {request.canRunAsMe ? (
        <Button
          size='sm'
          variant='outline'
          disabled={action.isPending}
          onClick={() => action.mutate('runAsMe')}
        >
          {action.isPending ? <Spinner /> : null}
          {t('issueLive.personalRunner.runAsMe')}
        </Button>
      ) : null}
    </span>
  );
}
