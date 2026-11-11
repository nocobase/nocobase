import { useState, type ReactElement, type ReactNode } from 'react';
import { cn } from 'cn';
import {
  CHAT_MOBILE_QUERY,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import { useMediaQuery } from './use-media-query.js';
/** List and conversation retain their identity when the panel changes size or returns to its list. */
export function ConversationPanelBody({
  history,
  conversation,
  historyHeader,
  historyClassName,
}: {
  readonly history: ReactNode;
  readonly conversation: ReactNode;
  readonly historyHeader?: ReactNode;
  readonly historyClassName?: string;
}): ReactElement {
  const panel = useChatPanel();
  const phone = useMediaQuery(CHAT_MOBILE_QUERY);
  const expanded =
    !phone && panel.mode === 'expanded' && panel.view !== 'history';
  const [historyMounted, setHistoryMounted] = useState(
    expanded || panel.view === 'history',
  );
  if ((expanded || panel.view === 'history') && !historyMounted)
    setHistoryMounted(true);
  const [conversationMounted, setConversationMounted] = useState(
    panel.view !== 'history',
  );
  if (panel.view !== 'history' && !conversationMounted)
    setConversationMounted(true);
  return (
    <div
      className={
        expanded
          ? 'relative grid min-h-0 min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] overflow-hidden'
          : 'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
      }
    >
      <div
        className={
          expanded
            ? cn('flex min-h-0 w-[264px] flex-col border-r', historyClassName)
            : panel.view === 'history'
              ? 'flex min-h-0 flex-1 flex-col'
              : 'hidden'
        }
        hidden={!expanded && panel.view !== 'history'}
        data-panel-history=''
      >
        {historyMounted && (
          <>
            {historyHeader}
            {history}
          </>
        )}
      </div>
      <div
        key='conversation'
        hidden={!expanded && panel.view === 'history'}
        className={
          expanded || panel.view !== 'history'
            ? 'flex min-h-0 min-w-0 flex-1 flex-col'
            : 'hidden'
        }
      >
        {conversationMounted && conversation}
      </div>
    </div>
  );
}
