/**
 * Deleting a conversation, from its "…" menu or the archived list: a confirm dialog saying what goes with it, then
 * `DELETE conversations/{id}` (`useConversationActions().remove`), and back to My sessions when it was open.
 */
import { useToaster } from '@nocobase/app-client';
import { useConversationActions } from '@nocobase/app-plugin-agents/client/chat';
import { useChatTranslation } from './chat-i18n.js';
import type { ReactElement } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';

export function DeleteConversationDialog({
  conversation,
  open,
  onOpenChange,
  onDeleted,
}: {
  readonly conversation: { readonly id: string; readonly title: string | null };
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** After it is gone, such as leaving its page. */
  readonly onDeleted?: () => void;
}): ReactElement {
  const { t } = useChatTranslation();
  const toaster = useToaster();
  const { remove } = useConversationActions();
  const title = conversation.title?.trim() || t('chat.untitled');
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid='delete-conversation'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('chat.deleteDialog.title', { title })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('chat.deleteDialog.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('chat.deleteDialog.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={remove.isPending}
            onClick={() =>
              // Followed from the promise: the header holding this dialog unmounts once the conversation is gone.
              void remove.mutateAsync(conversation.id).then(
                () => {
                  onOpenChange(false);
                  toaster.show({
                    type: 'success',
                    title: t('chat.deleteDialog.done', { title }),
                  });
                  onDeleted?.();
                },
                () => undefined,
              )
            }
          >
            {t('chat.deleteDialog.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
