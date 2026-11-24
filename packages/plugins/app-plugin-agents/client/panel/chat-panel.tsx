import { useContext, useState, type ReactElement } from 'react';
import { HeaderChoiceSlotContext } from './header-slot.js';
import {
  CapturingPageDraftContext,
  PageDraftStoreContext,
  useChatPanel,
} from '../chat.js';
import { ConversationPanelFrame } from './panel-frame.js';
import { ConversationPanelBody } from './panel-body.js';
import { ConversationView } from './conversation-view.js';
import { HistoryList } from './history-list.js';
import { PanelHeader, PanelHistoryHeader } from './panel-header.js';
import { useChatTranslation } from './chat-i18n.js';

export interface ChatPanelProps {
  /** The docked panel's width in pixels; 420 by default. Below `md` the panel fills the screen. */
  readonly width?: number;
}

/**
 * The agents' side panel: render it as a sibling of `<main>` inside a `relative flex` row, where it docks beside the
 * content (which narrows); below `md` it is a full-screen dialog. It has no association data, controller or service
 * registration requirement.
 */
export function ChatPanel({ width }: ChatPanelProps = {}): ReactElement | null {
  const store = useContext(PageDraftStoreContext);
  const [choiceSlot, setChoiceSlot] = useState<HTMLElement | null>(null);
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  if (!panel.available) return null;
  return (
    <ConversationPanelFrame
      title={t('chat.title')}
      {...(width === undefined ? {} : { width })}
    >
      <ConversationPanelBody
        historyHeader={<PanelHistoryHeader />}
        history={
          <HistoryList
            activeId={panel.conversationId}
            onOpen={panel.selectConversation}
            onOpenPage={panel.openPage}
            header={null}
          />
        }
        conversation={
          <CapturingPageDraftContext.Provider value={store}>
            <HeaderChoiceSlotContext.Provider value={choiceSlot}>
              <PanelHeader choiceSlot={setChoiceSlot} />
              <ConversationView conversationId={panel.conversationId} />
            </HeaderChoiceSlotContext.Provider>
          </CapturingPageDraftContext.Provider>
        }
      />
    </ConversationPanelFrame>
  );
}
