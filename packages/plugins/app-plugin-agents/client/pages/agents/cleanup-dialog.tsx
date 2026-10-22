/**
 * Runner-discovered agents nobody enabled and that never ran: preview and remove them outright, such as a batch left
 * from before the application stopped creating one agent per reported model. Each is re-checked on the server right
 * before removal; anything no longer eligible comes back skipped, never removed.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import { agentsKeys } from '../../api/keys.js';
import { AgListSkeleton, AgLoadError } from '../../components/ag-states.js';
import { Button } from '../../components/ui/button.js';
import { Checkbox } from '../../components/ui/checkbox.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useFormatters } from '../../lib/format.js';
import { useNotify } from '../../hooks/use-notify.js';

export interface CleanupDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function CleanupDialog({
  open,
  onClose,
}: CleanupDialogProps): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const format = useFormatters();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const candidates = useQuery({
    queryKey: agentsKeys.cleanupCandidates,
    queryFn: () => api.cleanupCandidates(),
    enabled: open,
  });
  const remove = useMutation({
    mutationFn: () => api.cleanup(selected),
    onSuccess: ({ removed, skipped }) => {
      setSelected([]);
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.cleanupCandidates,
      });
      notify.success(
        t('agents.cleanup.done', {
          removed: removed.length,
          skipped: skipped.length,
        }),
      );
    },
    onError: (error) => notify.error(error),
  });
  const data = candidates.data ?? [];
  const allSelected = data.length > 0 && selected.length === data.length;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setSelected([]);
          onClose();
        }
      }}
    >
      <DialogContent
        className='flex max-h-[calc(100dvh-2rem)] flex-col'
        data-testid='cleanup-dialog'
      >
        <DialogHeader className='shrink-0'>
          <DialogTitle>{t('agents.cleanup.title')}</DialogTitle>
          <DialogDescription>{t('agents.cleanup.description')}</DialogDescription>
        </DialogHeader>
        <div className='min-h-0 flex-1 space-y-2 overflow-y-auto'>
          {candidates.isError && !candidates.data ? (
            <AgLoadError
              title={t('agents.loadFailed')}
              error={candidates.error}
              onRetry={() => void candidates.refetch()}
            />
          ) : !candidates.data ? (
            <AgListSkeleton />
          ) : data.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('agents.cleanup.none')}
            </p>
          ) : (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setSelected(allSelected ? [] : data.map((item) => item.id))
                }
              >
                {t(
                  allSelected
                    ? 'agents.discovery.clearSelection'
                    : 'agents.discovery.selectAll',
                  { limit: data.length },
                )}
              </Button>
              {data.map((candidate) => (
                <div
                  key={candidate.id}
                  data-testid={`cleanup-candidate-${candidate.id}`}
                  className='flex items-center gap-3 rounded-lg border p-3'
                >
                  <Checkbox
                    aria-label={t('agents.cleanup.select', {
                      name: candidate.name,
                    })}
                    checked={selected.includes(candidate.id)}
                    onCheckedChange={(checked) =>
                      setSelected((current) =>
                        checked
                          ? [...current, candidate.id]
                          : current.filter((id) => id !== candidate.id),
                      )
                    }
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='font-medium'>{candidate.name}</div>
                    <div className='text-xs text-muted-foreground'>
                      {t('agents.cleanup.createdAt', {
                        when: format.relative(candidate.createdAt),
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        <DialogFooter className='shrink-0'>
          <Button variant='outline' onClick={onClose}>
            {t('actions.close')}
          </Button>
          <Button
            variant='destructive'
            disabled={selected.length === 0 || remove.isPending}
            onClick={() => remove.mutate()}
            data-testid='cleanup-submit'
          >
            {t('agents.cleanup.remove', { count: selected.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
