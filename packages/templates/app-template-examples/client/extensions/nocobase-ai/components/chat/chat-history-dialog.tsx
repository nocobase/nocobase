import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../shared/ui/dialog.js';
import { History, Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { AIToolCallDecision } from '../../providers/index.js';
import { ChatMessages } from './chat-messages.js';
import { ConversationList } from './conversation-list.js';

export function AIChatHistoryDialog({
  open: controlledOpen,
  onOpenChange,
  trigger,
  onToolCallDecision,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  onToolCallDecision?: (decision: AIToolCallDecision) => void | Promise<void>;
}) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [conversationListVisible, setConversationListVisible] = useState(true);

  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setConversationListVisible(true);
  }

  return (
    <>
      {trigger === null ? null : (
        <span onClick={() => setOpen(true)}>
          {trigger ?? (
            <Button variant='ghost' size='sm'>
              <History /> {t('chat.messageHistory', 'Message history')}
            </Button>
          )}
        </span>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='flex h-[82svh] w-[min(1040px,calc(100vw-2rem))] max-w-[1040px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1040px]'>
          <div className='flex h-12 shrink-0 items-center gap-2 border-b px-3 pr-12'>
            {!conversationListVisible ? (
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('chat.showConversations', 'Show conversations')}
                onClick={() => setConversationListVisible(true)}
              >
                <Menu />
              </Button>
            ) : null}
            <DialogTitle>
              {t('chat.messageHistory', 'Message history')}
            </DialogTitle>
          </div>
          <DialogDescription className='sr-only'>
            {t(
              'chat.messageHistory.description',
              'Browse conversations and inspect the full message history.',
            )}
          </DialogDescription>
          <div className='flex min-h-0 flex-1 overflow-hidden'>
            {conversationListVisible ? (
              <aside className='absolute top-12 bottom-0 left-0 z-20 w-[280px] border-r bg-card sm:relative sm:inset-auto sm:z-auto sm:block sm:w-[300px] sm:shrink-0'>
                <ConversationList
                  onClose={() => setConversationListVisible(false)}
                />
              </aside>
            ) : null}
            <ChatMessages onToolCallDecision={onToolCallDecision} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
