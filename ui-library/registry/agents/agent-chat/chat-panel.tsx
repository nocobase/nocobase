import type { ReactElement } from 'react';
import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import { ConversationPanelFrame } from './panel-frame.js';
import { ConversationPanelBody } from './panel-body.js';
import { ConversationView } from './conversation-view.js';
import { HistoryList } from './history-list.js';
import { PanelHeader, PanelHistoryHeader } from './panel-header.js';
import { useChatMode } from './chat-mode.js';
import { useChatTranslation } from './chat-i18n.js';

/** The simple panel has no association data, controller or service registration requirement. */
export function ChatPanel(): ReactElement | null {
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  const mode = useChatMode();
  if (!panel.available) return null;
  return (
    <ConversationPanelFrame title={t('chat.title')}>
      <ConversationPanelBody
        historyHeader={<PanelHistoryHeader />}
        history={
          <HistoryList
            mode={mode.mode}
            activeId={panel.conversationId}
            onOpen={panel.selectConversation}
            onOpenPage={panel.openPage}
            header={null}
          />
        }
        conversation={
          <>
            <PanelHeader />
            <ConversationView conversationId={panel.conversationId} />
          </>
        }
      />
    </ConversationPanelFrame>
  );
}
