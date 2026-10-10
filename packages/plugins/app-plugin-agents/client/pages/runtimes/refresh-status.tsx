import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import type { RunnerSummary } from '../../../shared/runners.js';
import { agentsKeys } from '../../api/keys.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { Button } from '../../components/ui/button.js';
import { DropdownMenuItem } from '../../components/ui/dropdown-menu.js';

export function RefreshStatus({
  runner,
  menu = false,
}: {
  readonly runner: RunnerSummary;
  readonly menu?: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const refresh = useMutation({
    mutationFn: () => api.refreshRunnerStatus(runner.id),
    onSuccess: (saved) => {
      queryClient.setQueryData<RunnerSummary[]>(agentsKeys.runners, (runners) =>
        runners?.map((item) =>
          item.id === saved.id
            ? { ...item, toolsRefreshRequestId: saved.toolsRefreshRequestId }
            : item,
        ),
      );
    },
    onError: (error) => notify.error(error),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: agentsKeys.runners });
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
    },
  });
  if (!runner.canManage || runner.status === 'revoked') return null;
  const supported = runner.features.includes('tools.refresh');
  const pending =
    refresh.isPending || (supported && Boolean(runner.toolsRefreshRequestId));
  const label = t(
    pending ? 'runtimes.refresh.checking' : 'runtimes.refresh.button',
  );
  const onClick = (): void => {
    if (supported) refresh.mutate();
    else notify.success(t('runtimes.refresh.restart'));
  };
  return menu ? (
    <DropdownMenuItem disabled={pending} onClick={onClick}>
      {label}
    </DropdownMenuItem>
  ) : (
    <Button variant='outline' disabled={pending} onClick={onClick}>
      {label}
    </Button>
  );
}
