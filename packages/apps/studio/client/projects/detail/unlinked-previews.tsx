/** Project-local rows for previews without a live issue association. */
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BoxIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import type { PreviewListItem } from '../../../shared/previews.js';
import { IssueStatusBadge } from '@/components/issue-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ProjectSection } from '@/extensions/nocobase-project-detail/project-detail';
import { PullRequestStateBadge } from '../../git/pull-requests.js';
import { useNotify } from '../../access/notify.js';
import {
  absoluteUrl,
  destroyProjectPreview,
  previewKeys,
} from '../../previews/api.js';

const colors = {
  waiting: 'gray',
  deploying: 'blue',
  ready: 'green',
  blocked: 'yellow',
  failed: 'red',
  destroyed: 'gray',
} as const;
const nameOf = (preview: PreviewListItem) =>
  `${preview.pullRequest?.repo ?? preview.repo} #${preview.pullRequest?.number ?? preview.number}`;

export function UnlinkedPreviewList({
  projectId,
  items,
  onDestroyed,
}: {
  readonly onDestroyed?: () => void;
  readonly projectId: string;
  readonly items: readonly PreviewListItem[];
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const queryClient = useQueryClient();
  const notify = useNotify();
  const [selected, setSelected] = useState<PreviewListItem | null>(null);
  const destroy = useMutation({
    mutationFn: (preview: PreviewListItem) =>
      destroyProjectPreview(api, projectId, preview.id),
    onSuccess: async (_, preview) => {
      setSelected(null);
      notify.success(t('previews.unlinkedDestroyed', { pr: nameOf(preview) }));
      // Remove the row immediately, then refresh both the content and the navigation gate.
      queryClient.setQueryData<PreviewListItem[]>(
        previewKeys.project(projectId),
        (old) => old?.filter((item) => item.id !== preview.id),
      );
      onDestroyed?.();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: previewKeys.project(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: previewKeys.unreleased(projectId),
        }),
      ]);
    },
    onError: (error) => notify.error(error, t('common.requestFailed')),
  });

  return (
    <>
      <div>
        <ProjectSection
          title={`${t('previews.unlinked')} · ${items.length}`}
          description={t('previews.unlinkedDescription')}
        >
          <ul className='divide-y'>
            {items.map((preview) => {
              const pr = preview.pullRequest;
              const name = nameOf(preview);
              const state = pr?.state;
              return (
                <li
                  key={preview.id}
                  className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm first:pt-0 last:pb-0'
                >
                  <div className='min-w-0 basis-full sm:flex-1'>
                    <span
                      className='block truncate font-mono text-xs text-muted-foreground'
                      title={name}
                    >
                      {name}
                    </span>
                    {pr?.url ? (
                      <a
                        href={pr.url}
                        target='_blank'
                        rel='noreferrer'
                        className='block truncate hover:underline'
                        title={pr.title || name}
                      >
                        {pr.title || name}
                      </a>
                    ) : (
                      <span className='block truncate' title={name}>
                        {name}
                      </span>
                    )}
                  </div>
                  {state === 'open' ||
                  state === 'closed' ||
                  state === 'merged' ? (
                    <PullRequestStateBadge state={state} />
                  ) : state ? (
                    <Badge variant='outline'>{state}</Badge>
                  ) : null}
                  <IssueStatusBadge
                    status={{
                      name: t(`previews.statuses.${preview.status}`),
                      color: colors[preview.status],
                    }}
                  />
                  {preview.runtime ? (
                    <span className='text-xs text-muted-foreground'>
                      {t(`previews.runtime.${preview.runtime.state}`)}
                    </span>
                  ) : null}
                  <span className='inline-flex min-w-0 max-w-full items-center gap-1 text-xs text-muted-foreground'>
                    <BoxIcon className='size-3 shrink-0' aria-hidden />
                    <span
                      className='truncate'
                      title={
                        preview.targetAppName ??
                        preview.targetAppId ??
                        preview.appId
                      }
                    >
                      {preview.targetAppName ??
                        preview.targetAppId ??
                        preview.appId}
                    </span>
                  </span>
                  {preview.url ? (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            size='icon-xs'
                            variant='ghost'
                            nativeButton={false}
                            aria-label={t('previews.open')}
                            render={
                              <a
                                href={absoluteUrl(preview.url)}
                                target='_blank'
                                rel='noreferrer'
                              />
                            }
                          />
                        }
                      >
                        <ExternalLinkIcon />
                      </TooltipTrigger>
                      <TooltipContent>{t('previews.open')}</TooltipContent>
                    </Tooltip>
                  ) : null}
                  {preview.canDestroy ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            disabled={destroy.isPending}
                            aria-label={t('previews.more', { pr: name })}
                          />
                        }
                      >
                        <MoreHorizontalIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='w-auto min-w-40'
                      >
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            variant='destructive'
                            onClick={() => setSelected(preview)}
                          >
                            <Trash2Icon />
                            {t('previews.destroy')}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </ProjectSection>
      </div>
      <AlertDialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open && !destroy.isPending) setSelected(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='break-words'>
              {t('previews.unlinkedDestroyTitle', {
                pr: selected ? nameOf(selected) : '',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription className='break-words'>
              {t('previews.unlinkedDestroyDescription', {
                app: selected?.appId ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={destroy.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={destroy.isPending}
              onClick={() => {
                if (selected && !destroy.isPending) destroy.mutate(selected);
              }}
            >
              {destroy.isPending ? <Spinner data-icon='inline-start' /> : null}
              {t('previews.destroy')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
