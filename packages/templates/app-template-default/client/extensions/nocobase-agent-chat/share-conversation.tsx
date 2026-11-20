import { useState, type ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import { copyText, resolveAppUrl, useToaster } from '@nocobase/app-client';
import {
  agentsQueryClient,
  useChatApi,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationShare } from '@nocobase/app-plugin-agents/shared/conversations';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { useChatTranslation } from './chat-i18n.js';

export function ShareConversation({
  conversationId,
  open,
  onOpenChange,
}: {
  readonly conversationId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}): ReactElement {
  const [selected, setSelected] = useState<string[]>([]);
  const [failedRecipients, setFailedRecipients] = useState<string[]>([]);
  const api = useChatApi();
  const panel = useChatPanel();
  const toaster = useToaster();
  const { t } = useChatTranslation();
  const { i18n } = useTranslation();
  const candidates = useQuery(
    {
      queryKey: ['agents', 'shareCandidates', conversationId],
      queryFn: () => api.shareCandidates(conversationId),
      enabled: open,
      retry: false,
    },
    agentsQueryClient(),
  );
  const sharesQueryKey = ['agents', 'shares', conversationId] as const;
  const shares = useQuery(
    {
      queryKey: sharesQueryKey,
      queryFn: () => api.shares(conversationId),
      enabled: open,
      retry: false,
    },
    agentsQueryClient(),
  );
  const change = useMutation(
    {
      mutationFn: async ({
        userId,
        revoke,
      }: {
        userId: string;
        revoke?: boolean;
      }) => {
        if (revoke) await api.revokeShare(conversationId, userId);
        else await api.share(conversationId, userId);
      },
      onSuccess: () => {
        void shares.refetch();
      },
    },
    agentsQueryClient(),
  );
  const shareMany = useMutation(
    {
      mutationFn: (userIds: string[]) =>
        Promise.allSettled(
          userIds.map((userId) => api.share(conversationId, userId)),
        ),
      onMutate: () => setFailedRecipients([]),
      onSuccess: (results, userIds) => {
        const failed = userIds.filter(
          (_, index) => results[index]?.status === 'rejected',
        );
        setSelected(failed);
        setFailedRecipients(failed);
        agentsQueryClient().setQueryData<readonly ConversationShare[]>(
          sharesQueryKey,
          (previous) => {
            const rows = new Map(
              (previous ?? []).map((row) => [row.userId, row]),
            );
            for (const result of results) {
              if (result.status === 'fulfilled')
                rows.set(result.value.userId, result.value);
            }
            return [...rows.values()];
          },
        );
        void shares.refetch();
      },
    },
    agentsQueryClient(),
  );
  const busy = change.isPending || shareMany.isPending;
  const names = new Map(
    (candidates.data ?? []).map((person) => [person.id, person.name]),
  );
  const copy = async () => {
    const href = panel.conversationPath?.(conversationId);
    if (!href) return;
    try {
      await copyText(new URL(resolveAppUrl(href), window.location.href).href);
      toaster.show({ type: 'success', title: t('chat.sharing.copied') });
    } catch {
      toaster.show({ type: 'error', title: t('chat.sharing.copyFailed') });
    }
  };
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          {/* The phone Agent panel is itself a dialog; nested backdrops need forceRender. */}
          <DialogOverlay forceRender />
          <DialogPrimitive.Popup
            data-slot='dialog-content'
            className='fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 max-h-[85dvh] gap-5 overflow-y-auto rounded-xl bg-popover p-6 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
            data-testid='share-conversation'
          >
            <DialogHeader>
              <DialogTitle>{t('chat.sharing.title')}</DialogTitle>
              <DialogDescription>
                {t('chat.sharing.description')}
              </DialogDescription>
            </DialogHeader>
            <p className='text-sm text-muted-foreground'>
              {t('chat.sharing.sensitive')}
            </p>
            {candidates.isError || shares.isError || change.isError ? (
              <p role='alert' className='text-sm text-destructive'>
                {t('chat.sharing.failed')}
              </p>
            ) : null}
            {failedRecipients.length > 0 && (
              <p role='alert' className='text-sm text-destructive'>
                {t('chat.sharing.failedRecipients', {
                  names: failedRecipients
                    .map((id) => names.get(id) ?? id)
                    .join(', '),
                })}
              </p>
            )}
            <div className='flex min-w-0 gap-2'>
              <Select
                multiple
                modal={false}
                disabled={busy}
                value={selected}
                onValueChange={(value) => {
                  setSelected(value);
                  setFailedRecipients((previous) =>
                    previous.filter((id) => value.includes(id)),
                  );
                }}
              >
                <SelectTrigger
                  className='min-w-0 flex-1'
                  aria-label={t('chat.sharing.recipient')}
                >
                  <SelectValue placeholder={t('chat.sharing.recipient')}>
                    {selected.length > 0
                      ? selected.map((id) => names.get(id) ?? id).join(', ')
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(candidates.data ?? []).map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={selected.length === 0 || busy}
                onClick={() => shareMany.mutate(selected)}
              >
                {t('chat.sharing.share')}
              </Button>
            </div>
            <ul className='space-y-3'>
              {(shares.data ?? []).map((share) => (
                <li
                  key={share.userId}
                  className='flex flex-wrap items-center gap-2 text-sm'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='truncate'>{share.name ?? share.userId}</p>
                    <p className='text-xs text-muted-foreground'>
                      {t('chat.sharing.asOf', {
                        time: new Intl.DateTimeFormat(i18n.language, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(share.snapshotAt)),
                      })}
                    </p>
                  </div>
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={busy}
                    onClick={() => change.mutate({ userId: share.userId })}
                  >
                    {t('chat.sharing.update')}
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
                    disabled={busy}
                    onClick={() =>
                      change.mutate({ userId: share.userId, revoke: true })
                    }
                  >
                    {t('chat.sharing.revoke')}
                  </Button>
                </li>
              ))}
            </ul>
            {shares.isPending ? (
              <p role='status'>{t('chat.loading')}</p>
            ) : !shares.data?.length ? (
              <p className='text-sm text-muted-foreground'>
                {t('chat.sharing.none')}
              </p>
            ) : null}
            {panel.conversationPath && (
              <Button variant='outline' onClick={() => void copy()}>
                {t('chat.sharing.copy')}
              </Button>
            )}
            <DialogClose
              render={
                <Button
                  variant='ghost'
                  className='absolute top-2 right-2'
                  size='icon-sm'
                />
              }
            >
              <XIcon />
              <span className='sr-only'>{t('chat.close')}</span>
            </DialogClose>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </>
  );
}
