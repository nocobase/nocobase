/**
 * Runner-discovered agents nobody enabled and that never ran: preview and remove them outright, such as a batch left
 * from before the application stopped creating one agent per reported model — the thing that once left a tool with
 * hundreds of these. A large drawer, grouped by tool with "select all in group", because that batch can be long;
 * "select all" covers the whole group, not just the page already loaded. Each is re-checked on the server right
 * before removal; anything no longer eligible comes back skipped, never removed, which the drawer's own confirmation
 * names before anyone commits to it.
 */
import type { AgentTool } from '@nocobase/agent-protocol';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useMemo, useState, type ReactElement } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { CleanupCandidate, CleanupGroup } from '../../../shared/agents.js';
import { TOOL_LABELS } from '../../../shared/model-catalog.js';
import { agentsKeys } from '../../api/keys.js';
import { AgListSkeleton, AgLoadError } from '../../components/ag-states.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog.js';
import { Button, buttonVariants } from '../../components/ui/button.js';
import { Checkbox } from '../../components/ui/checkbox.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { useFormatters } from '../../lib/format.js';
import { useNotify } from '../../hooks/use-notify.js';

const VIRTUALIZE_THRESHOLD = 30;
const PAGE_SIZE = 50;
/** How many ids one "select all in group" page fetch asks for; large enough that most groups need only one call. */
const SELECT_ALL_PAGE_SIZE = 500;

export interface CleanupDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function CleanupDrawer({
  open,
  onClose,
}: CleanupDrawerProps): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<
    ReadonlyMap<string, CleanupCandidate>
  >(() => new Map());
  const [confirming, setConfirming] = useState(false);

  const reset = (): void => {
    setSelected(new Map());
    setConfirming(false);
  };

  const groups = useQuery({
    queryKey: agentsKeys.cleanupGroups(''),
    queryFn: () => api.cleanupGroups(),
    enabled: open,
  });

  const setRowSelected = (
    candidate: CleanupCandidate,
    checked: boolean,
  ): void =>
    setSelected((current) => {
      const next = new Map(current);
      if (checked) next.set(candidate.id, candidate);
      else next.delete(candidate.id);
      return next;
    });

  const setGroupSelected = (
    group: readonly CleanupCandidate[],
    checked: boolean,
  ): void =>
    setSelected((current) => {
      const next = new Map(current);
      for (const candidate of group)
        if (checked) next.set(candidate.id, candidate);
        else next.delete(candidate.id);
      return next;
    });

  const remove = useMutation({
    mutationFn: () => api.cleanup([...selected.keys()]),
    onSuccess: ({ removed, skipped }) => {
      setSelected(new Map());
      setConfirming(false);
      void queryClient.invalidateQueries({ queryKey: agentsKeys.agents });
      void queryClient.invalidateQueries({
        queryKey: agentsKeys.cleanupCandidatesAll,
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

  const tools = useMemo(
    () => [...new Set([...selected.values()].map((c) => c.tool))],
    [selected],
  );
  const toolNames = tools
    .map((tool) => (tool ? TOOL_LABELS[tool] : ''))
    .filter(Boolean)
    .join(', ');

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
    >
      <SheetContent
        className='flex w-full flex-col gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[780px]'
        data-testid='cleanup-drawer'
      >
        <SheetHeader className='shrink-0'>
          <SheetTitle>{t('agents.cleanup.title')}</SheetTitle>
          <SheetDescription>{t('agents.cleanup.description')}</SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3 sm:px-6'>
          {groups.isError && !groups.data ? (
            <AgLoadError
              title={t('agents.loadFailed')}
              error={groups.error}
              onRetry={() => void groups.refetch()}
            />
          ) : !groups.data ? (
            <AgListSkeleton />
          ) : groups.data.data.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('agents.cleanup.none')}
            </p>
          ) : (
            groups.data.data.map((group) => (
              <CleanupToolGroup
                key={group.tool ?? ''}
                group={group}
                selected={selected}
                onSelectRow={setRowSelected}
                onSelectGroup={setGroupSelected}
              />
            ))
          )}
        </div>
        <SheetFooter className='shrink-0 flex-row items-center justify-between border-t'>
          <div className='text-sm text-muted-foreground'>
            {selected.size > 0
              ? t('agents.cleanup.selectedCount', { count: selected.size })
              : null}
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={onClose}>
              {t('actions.close')}
            </Button>
            <AlertDialog open={confirming} onOpenChange={setConfirming}>
              <AlertDialogTrigger
                className={buttonVariants({ variant: 'destructive' })}
                disabled={selected.size === 0 || remove.isPending}
                data-testid='cleanup-open-confirm'
              >
                {t('agents.cleanup.remove', { count: selected.size })}
              </AlertDialogTrigger>
              <AlertDialogContent data-testid='cleanup-confirm'>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('agents.cleanup.confirmTitle', { count: selected.size })}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('agents.cleanup.confirmDescription', {
                      tools: toolNames,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('actions.back')}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={remove.isPending}
                    onClick={() => remove.mutate()}
                    data-testid='cleanup-confirm-submit'
                  >
                    {t('agents.cleanup.confirmAction', {
                      count: selected.size,
                    })}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function CleanupToolGroup({
  group,
  selected,
  onSelectRow,
  onSelectGroup,
}: {
  readonly group: CleanupGroup;
  readonly selected: ReadonlyMap<string, CleanupCandidate>;
  readonly onSelectRow: (candidate: CleanupCandidate, checked: boolean) => void;
  readonly onSelectGroup: (
    group: readonly CleanupCandidate[],
    checked: boolean,
  ) => void;
}): ReactElement {
  const { t } = useTranslation();
  const format = useFormatters();
  const api = useAgentsApi();
  const [open, setOpen] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  const label = group.tool ? TOOL_LABELS[group.tool] : '';
  const rows = useInfiniteQuery({
    queryKey: agentsKeys.cleanupRows(group.tool ?? '', ''),
    queryFn: ({ pageParam }) =>
      api.cleanupRows(group.tool as AgentTool, {
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page * last.meta.pageSize < last.meta.total
        ? last.meta.page + 1
        : undefined,
    enabled: open && group.tool !== null,
  });
  const loaded = useMemo(
    () => rows.data?.pages.flatMap((page) => page.data) ?? [],
    [rows.data],
  );
  const allSelected =
    loaded.length > 0 && loaded.every((row) => selected.has(row.id));

  const selectAllInGroup = async (checked: boolean): Promise<void> => {
    if (!checked) {
      onSelectGroup(loaded, false);
      return;
    }
    if (!group.tool) return;
    setSelectingAll(true);
    try {
      const all: CleanupCandidate[] = [];
      let page = 1;
      for (;;) {
        const answer = await api.cleanupRows(group.tool, {
          page,
          pageSize: SELECT_ALL_PAGE_SIZE,
        });
        all.push(...answer.data);
        if (answer.meta.page * answer.meta.pageSize >= answer.meta.total) break;
        page += 1;
      }
      onSelectGroup(all, true);
    } finally {
      setSelectingAll(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className='rounded-lg border'>
        <CollapsibleTrigger
          className='flex w-full items-center justify-between gap-3 p-3 text-left'
          data-testid={`cleanup-group-${group.tool ?? 'none'}`}
        >
          <span className='font-medium'>
            {t('agents.cleanup.group', { count: group.count, tool: label })}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className='border-t px-3 pb-3'>
          {rows.isError && !rows.data ? (
            <AgLoadError
              title={t('agents.loadFailed')}
              error={rows.error}
              onRetry={() => void rows.refetch()}
            />
          ) : !rows.data ? (
            <AgListSkeleton rows={2} />
          ) : (
            <div className='pt-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mb-2'
                disabled={selectingAll}
                onClick={() => void selectAllInGroup(!allSelected)}
                data-testid={`cleanup-group-select-all-${group.tool ?? 'none'}`}
              >
                {t(
                  allSelected
                    ? 'agents.cleanup.clearGroup'
                    : 'agents.cleanup.selectGroup',
                  { tool: label },
                )}
              </Button>
              {loaded.length > VIRTUALIZE_THRESHOLD ? (
                <Virtuoso
                  style={{ height: 320 }}
                  data={loaded}
                  computeItemKey={(_, row) => row.id}
                  endReached={() => {
                    if (rows.hasNextPage && !rows.isFetchingNextPage)
                      void rows.fetchNextPage();
                  }}
                  itemContent={(_, candidate) => (
                    <div className='py-1'>
                      <CandidateRow
                        candidate={candidate}
                        checked={selected.has(candidate.id)}
                        onSelect={onSelectRow}
                        formatRelative={format.relative}
                      />
                    </div>
                  )}
                />
              ) : (
                <div className='space-y-1'>
                  {loaded.map((candidate) => (
                    <CandidateRow
                      key={candidate.id}
                      candidate={candidate}
                      checked={selected.has(candidate.id)}
                      onSelect={onSelectRow}
                      formatRelative={format.relative}
                    />
                  ))}
                </div>
              )}
              {rows.hasNextPage ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='mt-2'
                  disabled={rows.isFetchingNextPage}
                  onClick={() => void rows.fetchNextPage()}
                >
                  {t('agents.loadMore')}
                </Button>
              ) : null}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function CandidateRow({
  candidate,
  checked,
  onSelect,
  formatRelative,
}: {
  readonly candidate: CleanupCandidate;
  readonly checked: boolean;
  readonly onSelect: (candidate: CleanupCandidate, checked: boolean) => void;
  readonly formatRelative: (value: string) => string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      data-testid={`cleanup-candidate-${candidate.id}`}
      className='flex items-center gap-3 rounded-md p-2 hover:bg-muted/50'
    >
      <Checkbox
        aria-label={t('agents.cleanup.select', { name: candidate.name })}
        checked={checked}
        onCheckedChange={(next) => onSelect(candidate, next === true)}
      />
      <div className='min-w-0 flex-1'>
        <div className='font-medium'>{candidate.name}</div>
        <div className='text-xs text-muted-foreground'>
          {t('agents.cleanup.neverEnabled')} ·{' '}
          {t('agents.cleanup.createdAt', {
            when: formatRelative(candidate.createdAt),
          })}
        </div>
      </div>
    </div>
  );
}
