/**
 * A document's sections in the semantic index: the badge its header shows while semantic search is on (indexed,
 * indexing with how many of how many, or failed with the reason on hover and, for someone who may edit, "Index again"),
 * and the sheet listing its sections, each with its headings, lines, length and state; choosing one highlights its
 * lines in the document.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCwIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet.js';
import { Skeleton } from './ui/skeleton.js';
import { Spinner } from './ui/spinner.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type {
  KnowledgeChunkInfo,
  KnowledgeDocIndex,
  KnowledgeIndexState,
} from '../../shared/knowledge.js';
import {
  knowledgeKeys,
  useKnowledgeApi,
  useKnowledgeDocIndex,
} from '../api.js';
import { useNotify } from '../hooks/use-notify.js';

/** A section's or a document's state as a badge. */
function StateBadge({
  state,
}: {
  readonly state: KnowledgeIndexState;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Badge
      variant={
        state === 'failed'
          ? 'destructive'
          : state === 'pending'
            ? 'outline'
            : 'secondary'
      }
    >
      {t(`knowledge.index.states.${state}`)}
    </Badge>
  );
}

/** The header's badge, shown only while semantic search is on; "Index again" beside a failure for an editor. */
export function DocIndexBadge({
  docId,
  editable,
}: {
  readonly docId: string;
  readonly editable: boolean;
}): ReactElement | null {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const index = useKnowledgeDocIndex(docId);
  const api = useKnowledgeApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const again = useMutation({
    mutationFn: () => api.reindex(docId),
    onSuccess: (data) => {
      queryClient.setQueryData(knowledgeKeys.docIndex(docId), data);
      notify.success(t('knowledge.index.queued'));
    },
    onError: (error) => notify.error(error),
  });
  const data = index.data;
  if (!data?.enabled || data.state === null) return null;
  if (data.state === 'done')
    return (
      <Badge variant='secondary' data-testid='knowledge-index-badge'>
        {t('knowledge.index.done')}
      </Badge>
    );
  if (data.state === 'pending')
    return (
      <Badge variant='outline' data-testid='knowledge-index-badge'>
        <Spinner data-icon='inline-start' />
        {t('knowledge.index.pending', {
          indexed: data.indexed,
          total: data.total,
        })}
      </Badge>
    );
  const reason = data.chunks.find((chunk) => chunk.error)?.error ?? null;
  return (
    <span className='inline-flex items-center gap-1'>
      <Tooltip>
        <TooltipTrigger
          render={<span className='inline-flex' tabIndex={0} />}
          data-testid='knowledge-index-badge'
        >
          <Badge variant='destructive'>
            {t('knowledge.index.failed', { count: data.failed })}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className='max-w-80'>
          {reason
            ? t('knowledge.index.reason', { reason })
            : t('knowledge.index.failedHint')}
        </TooltipContent>
      </Tooltip>
      {editable ? (
        <Button
          variant='ghost'
          size='sm'
          disabled={again.isPending}
          onClick={() => again.mutate()}
        >
          {again.isPending ? (
            <Spinner data-icon='inline-start' />
          ) : (
            <RefreshCwIcon data-icon='inline-start' />
          )}
          {t('knowledge.index.retry')}
        </Button>
      ) : null}
    </span>
  );
}

function ChunkRow({
  chunk,
  onShow,
}: {
  readonly chunk: KnowledgeChunkInfo;
  readonly onShow: (lines: readonly [number, number]) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <li>
      <button
        type='button'
        className='flex w-full min-w-0 flex-col gap-1 px-3 py-2 text-left text-sm hover:bg-muted'
        onClick={() => onShow(chunk.lines)}
      >
        <span className='flex w-full min-w-0 items-center gap-2'>
          <span className='w-6 shrink-0 text-muted-foreground tabular-nums'>
            {chunk.ordinal + 1}
          </span>
          <span className='min-w-0 flex-1 truncate font-medium'>
            {chunk.headingPath.length > 0
              ? chunk.headingPath.join(' › ')
              : t('knowledge.chunks.lead')}
          </span>
          {chunk.state ? <StateBadge state={chunk.state} /> : null}
        </span>
        <span className='pl-8 text-xs text-muted-foreground tabular-nums'>
          {t('knowledge.chunks.lines', {
            start: chunk.lines[0],
            end: chunk.lines[1],
          })}
          {' · '}
          {t('knowledge.chunks.chars', { count: chunk.chars })}
        </span>
        {chunk.error ? (
          <span className='pl-8 text-xs text-destructive wrap-anywhere'>
            {chunk.error}
          </span>
        ) : null}
      </button>
    </li>
  );
}

/** The sheet of a document's sections, read-only; choosing one shows its lines. */
export function ChunksSheet({
  open,
  onOpenChange,
  docId,
  title,
  onShow,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly docId: string;
  readonly title: string;
  readonly onShow: (lines: readonly [number, number]) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const index = useKnowledgeDocIndex(open ? docId : null);
  const data: KnowledgeDocIndex | undefined = index.data;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='w-full gap-0 data-[side=right]:sm:max-w-xl'
        data-testid='knowledge-chunks'
      >
        <SheetHeader className='border-b pr-12'>
          <SheetTitle>{t('knowledge.chunks.title')}</SheetTitle>
          <SheetDescription>
            {data
              ? t('knowledge.chunks.description', {
                  title,
                  count: data.total,
                })
              : title}
          </SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 overflow-y-auto p-4'>
          {index.isPending ? (
            <Skeleton
              className='h-24 w-full'
              aria-label={t('knowledge.loading')}
            />
          ) : index.isError ? (
            <p className='text-sm text-muted-foreground'>
              {t('knowledge.loadFailed')}
            </p>
          ) : !data || data.chunks.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              {t('knowledge.chunks.empty')}
            </p>
          ) : (
            <ol className='divide-y rounded-lg border'>
              {data.chunks.map((chunk) => (
                <ChunkRow
                  key={chunk.ordinal}
                  chunk={chunk}
                  onShow={(lines) => {
                    onOpenChange(false);
                    onShow(lines);
                  }}
                />
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
