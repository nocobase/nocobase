import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../shared/ui/tooltip.js';
import { useAIChatBase } from '../../providers/index.js';
import { Menu, PanelLeftClose, PlusCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { UserPromptEditor } from './user-prompt-editor.js';

export function ChatHeader({
  actions,
  showConversationToggle = true,
  showNewConversation = true,
  showUserPrompt = true,
}: {
  actions?: ReactNode;
  showConversationToggle?: boolean;
  showNewConversation?: boolean;
  showUserPrompt?: boolean;
}) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const {
    activeConversation,
    conversations,
    conversationListOpen,
    setConversationListOpen,
    startNewConversation,
  } = useAIChatBase();
  const unreadCount = conversations.filter(
    (conversation) => conversation.unread,
  ).length;

  return (
    <header className='grid h-12 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center border-b bg-card px-2.5'>
      <div className='flex min-w-8 items-center'>
        {showConversationToggle ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('chat.conversationList', 'Conversation list')}
                  onClick={() => setConversationListOpen(!conversationListOpen)}
                />
              }
            >
              <span className='relative'>
                {conversationListOpen ? <PanelLeftClose /> : <Menu />}
                {!conversationListOpen && unreadCount > 0 ? (
                  <span className='absolute -right-1 -top-1 size-2 rounded-full bg-destructive ring-2 ring-card' />
                ) : null}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {t('chat.conversationList', 'Conversation list')}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <div className='pointer-events-none min-w-0 truncate px-2 text-center text-sm font-medium'>
        {activeConversation?.title ??
          t('chat.newConversation', 'New conversation')}
      </div>

      <div className='flex shrink-0 items-center gap-0.5'>
        {showUserPrompt ? <UserPromptEditor /> : null}
        {showNewConversation ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t(
                    'chat.newConversationAction',
                    'New conversation',
                  )}
                  onClick={startNewConversation}
                />
              }
            >
              <PlusCircle />
            </TooltipTrigger>
            <TooltipContent>
              {t('chat.newConversationAction', 'New conversation')}
            </TooltipContent>
          </Tooltip>
        ) : null}
        {actions}
      </div>
    </header>
  );
}
