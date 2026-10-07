/**
 * Route `/runtimes`: the runtimes that run agents (a runner on a server, a VM or someone's own device). The list is an
 * overview, one row per runtime: its name with its system, its state with the slots it uses, its coding tools by
 * whether each is signed in, whether it is personal or shared with the team, its runner version (marked when a newer
 * one is served) and when it was last seen. Clicking a row, or "Edit" in its menu, opens the runtime's sheet
 * (`runner-sheet.tsx`), which holds every setting; the menu also revokes it, or deletes it once revoked. Revoked
 * runtimes sit folded below until deleted.
 *
 * Mirrors NocoProject's runtimes page (`nocoproject/client/pages/np/runtimes/index.tsx`): a runner is now both the
 * runtime and its key.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRightIcon,
  MonitorIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, Outlet } from 'react-router';

import type { RunnerSummary } from '../../../shared/runners.js';
import { agentsKeys } from '../../api/keys.js';
import {
  AgEmpty,
  AgListSkeleton,
  AgLoadError,
} from '../../components/ag-states.js';
import { AgTag } from '../../components/ag-tag.js';
import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog.js';
import { Button } from '../../components/ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useNotify } from '../../hooks/use-notify.js';
import { useFormatters } from '../../lib/format.js';
import {
  RunnerStatusCell,
  RunnerToolsCell,
  RunnerVersionCell,
} from './runner-cells.js';
import { RunnerSheet } from './runner-sheet.js';

interface Confirming {
  readonly kind: 'revoke' | 'delete';
  readonly runner: RunnerSummary;
}

export default function RuntimesPage(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Confirming | null>(null);

  const runners = useQuery({
    queryKey: agentsKeys.runners,
    queryFn: () => api.runners(),
  });
  const settled = (): void => {
    void queryClient.invalidateQueries({ queryKey: agentsKeys.runners });
    void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
  };
  const revoke = useMutation({
    mutationFn: (runner: RunnerSummary) => api.revokeRunner(runner.id),
    onSuccess: (runner) =>
      notify.success(t('runtimes.revoke.done', { name: runner.name })),
    onError: (error) => notify.error(error),
    onSettled: settled,
  });
  const remove = useMutation({
    mutationFn: async (runner: RunnerSummary) => {
      await api.deleteRunner(runner.id);
      return runner;
    },
    onSuccess: (runner) =>
      notify.success(t('runtimes.delete.done', { name: runner.name })),
    onError: (error) => notify.error(error),
    onSettled: settled,
  });

  const addButton = (
    <Button nativeButton={false} render={<Link to='connect' />}>
      <PlusIcon data-icon='inline-start' />
      {t('runtimes.add')}
    </Button>
  );

  let content: ReactElement;
  if (runners.isError && !runners.data)
    content = (
      <AgLoadError
        title={t('runtimes.loadFailed')}
        error={runners.error}
        onRetry={() => void runners.refetch()}
      />
    );
  else if (!runners.data) content = <AgListSkeleton />;
  else if (runners.data.length === 0)
    content = (
      <AgEmpty
        icon={<MonitorIcon />}
        title={t('runtimes.emptyTitle')}
        description={t('runtimes.emptyDescription')}
        action={addButton}
      />
    );
  else {
    const current = runners.data.filter(
      (runner) => runner.status !== 'revoked',
    );
    const revoked = runners.data.filter(
      (runner) => runner.status === 'revoked',
    );
    const table = (list: readonly RunnerSummary[]) => (
      <RunnerTable
        runners={list}
        onOpen={(runner) => setOpenId(runner.id)}
        onRevoke={(runner) => setConfirming({ kind: 'revoke', runner })}
        onDelete={(runner) => setConfirming({ kind: 'delete', runner })}
      />
    );
    content = (
      <div className='space-y-3'>
        {current.length > 0 ? (
          table(current)
        ) : (
          <p className='text-sm text-muted-foreground'>
            {t('runtimes.noneConnected')}
          </p>
        )}
        {revoked.length > 0 ? (
          <Collapsible>
            <CollapsibleTrigger
              render={
                <Button
                  variant='ghost'
                  size='sm'
                  className='group/fold -ml-2 gap-1.5 px-2 text-muted-foreground'
                />
              }
            >
              <ChevronRightIcon
                data-icon='inline-start'
                className='transition-transform group-data-panel-open/fold:rotate-90'
              />
              {t('runtimes.revokedList', { count: revoked.length })}
            </CollapsibleTrigger>
            <CollapsibleContent className='pt-3'>
              {table(revoked)}
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </div>
    );
  }

  const target = confirming?.runner;
  const opened = runners.data?.find((runner) => runner.id === openId) ?? null;
  return (
    <PageContainer>
      <PageHeader
        title={t('runtimes.title')}
        description={t('runtimes.description')}
        actions={runners.data && runners.data.length > 0 ? addButton : null}
      />
      {content}
      <RunnerSheet runner={opened} onClose={() => setOpenId(null)} />
      <AlertDialog
        open={confirming !== null}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming
                ? t(`runtimes.${confirming.kind}.title`, {
                    name: target?.name ?? '',
                  })
                : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming ? t(`runtimes.${confirming.kind}.description`) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                if (confirming?.kind === 'revoke')
                  revoke.mutate(confirming.runner);
                else if (confirming?.kind === 'delete') {
                  remove.mutate(confirming.runner);
                  if (openId === confirming.runner.id) setOpenId(null);
                }
                setConfirming(null);
              }}
            >
              {confirming ? t(`runtimes.${confirming.kind}.confirm`) : null}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Outlet />
    </PageContainer>
  );
}

function RunnerTable({
  runners,
  onOpen,
  onRevoke,
  onDelete,
}: {
  readonly runners: readonly RunnerSummary[];
  readonly onOpen: (runner: RunnerSummary) => void;
  readonly onRevoke: (runner: RunnerSummary) => void;
  readonly onDelete: (runner: RunnerSummary) => void;
}): ReactElement {
  const { t } = useTranslation();
  const format = useFormatters();
  return (
    <div className='rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('runtimes.columns.name')}</TableHead>
            <TableHead>{t('runtimes.columns.status')}</TableHead>
            <TableHead>{t('runtimes.columns.tools')}</TableHead>
            <TableHead>{t('runtimes.columns.sharing')}</TableHead>
            <TableHead>{t('runtimes.columns.version')}</TableHead>
            <TableHead>{t('runtimes.columns.lastSeen')}</TableHead>
            <TableHead className='w-10' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {runners.map((runner) => (
            <TableRow
              key={runner.id}
              data-testid={`runner-${runner.id}`}
              className='cursor-pointer'
              onClick={() => onOpen(runner)}
            >
              <TableCell>
                <div className='min-w-0 leading-tight'>
                  <button
                    type='button'
                    className='block max-w-full cursor-pointer truncate text-left font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring'
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(runner);
                    }}
                  >
                    {runner.name}
                  </button>
                  <div className='truncate text-xs text-muted-foreground'>
                    {runner.os} · {runner.arch}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <RunnerStatusCell runner={runner} />
              </TableCell>
              <TableCell className='whitespace-normal'>
                <RunnerToolsCell runner={runner} />
              </TableCell>
              <TableCell>
                <AgTag tone={runner.trust === 'team' ? 'violet' : 'grey'}>
                  {t(`runtimes.trust.${runner.trust}`)}
                </AgTag>
              </TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                <RunnerVersionCell runner={runner} />
              </TableCell>
              <TableCell
                className='text-xs text-muted-foreground'
                title={format.dateTime(runner.lastSeenAt)}
              >
                {format.relative(runner.lastSeenAt)}
              </TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                {runner.canManage ? (
                  <RunnerActions
                    runner={runner}
                    onEdit={() => onOpen(runner)}
                    onRevoke={() => onRevoke(runner)}
                    onDelete={() => onDelete(runner)}
                  />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RunnerActions({
  runner,
  onEdit,
  onRevoke,
  onDelete,
}: {
  readonly runner: RunnerSummary;
  readonly onEdit: () => void;
  readonly onRevoke: () => void;
  readonly onDelete: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const revoked = runner.status === 'revoked';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label={t('runtimes.actionsFor', { name: runner.name })}
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-auto min-w-40'>
        {revoked ? null : (
          <>
            <DropdownMenuItem onClick={onEdit}>
              {t('runtimes.edit.button')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {revoked ? (
          <DropdownMenuItem variant='destructive' onClick={onDelete}>
            {t('runtimes.delete.confirm')}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant='destructive' onClick={onRevoke}>
            {t('runtimes.revoke.confirm')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
