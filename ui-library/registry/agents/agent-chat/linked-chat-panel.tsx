import { useEffect, type ReactElement, type ReactNode } from 'react';
import {
  isChatShortcut,
  CHAT_MOBILE_QUERY,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import type { ConversationMode } from '@nocobase/app-plugin-agents/shared/conversations';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import { ConversationPanelFrame } from './panel-frame.js';
import {
  ConversationAssociationsProvider,
  type ConversationAssociationOptions,
} from './conversation-associations.js';
import { ChatWorkspace, type ChatWorkspaceProps } from './workspace.js';
import { useChatMode } from './chat-mode.js';
import { useMediaQuery } from './use-media-query.js';
import { useChatTranslation } from './chat-i18n.js';

/** What a host adds to the workspace in the panel; the selection, Close and Expand are the panel's. */
export type LinkedChatWorkspaceSlots = Omit<
  ChatWorkspaceProps,
  | 'conversationId'
  | 'view'
  | 'onOpen'
  | 'onNew'
  | 'onBack'
  | 'onClose'
  | 'onExpand'
  | 'expanded'
> & {
  /** Starts a new conversation the host's way, such as with a fresh draft; the panel store's otherwise. */
  readonly onNew?: (() => void) | undefined;
};

export interface LinkedChatPanelProps extends ConversationAssociationOptions {
  readonly title?: string;
  /** Slots of the chat workspace the panel shows, the same one a full page shows. */
  readonly workspace?: LinkedChatWorkspaceSlots;
  /** Replaces the workspace, such as while the host is still loading. */
  readonly content?: ReactNode;
  readonly footer?: ReactNode;
  readonly preferComposer?: boolean;
  /** Hosts with their own transport selector can handle the shortcut themselves. */
  readonly listFirstShortcut?: boolean;
}

/** The side panel: the chat workspace inside the panel frame, its selection kept in the panel store. */
export function LinkedChatPanel({
  title,
  workspace,
  content,
  footer,
  preferComposer,
  listFirstShortcut = true,
  ...associations
}: LinkedChatPanelProps): ReactElement | null {
  const panel = useChatPanel();
  const { t } = useChatTranslation();
  useEffect(() => {
    if (!listFirstShortcut || !panel.available) return;
    const open = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && !panel.open && isChatShortcut(event)) {
        event.preventDefault();
        panel.openChat({ view: 'history' });
      }
    };
    window.addEventListener('keydown', open, true);
    return () => window.removeEventListener('keydown', open, true);
  }, [listFirstShortcut, panel]);
  if (!panel.available) return null;
  return (
    <ConversationAssociationsProvider {...associations}>
      <ConversationPanelFrame
        title={title ?? t('chat.title')}
        preferComposer={preferComposer}
      >
        {content ?? <PanelWorkspace slots={workspace} />}
        {footer}
      </ConversationPanelFrame>
    </ConversationAssociationsProvider>
  );
}

/** The chat workspace bound to the panel store; any host can mount the same binding inside its own frame. */
export function PanelWorkspace({
  slots,
}: {
  readonly slots?: LinkedChatWorkspaceSlots | undefined;
}): ReactElement {
  // A host's own list heading replaces the agent-kind tabs and their filter.
  return slots?.list?.heading !== undefined ? (
    <BoundWorkspace slots={slots} />
  ) : (
    <ModeWorkspace slots={slots} />
  );
}

function ModeWorkspace({
  slots,
}: {
  readonly slots?: LinkedChatWorkspaceSlots | undefined;
}): ReactElement {
  const mode = useChatMode();
  return (
    <BoundWorkspace
      slots={{
        ...slots,
        list: { heading: <ModeTabs />, mode: mode.mode, ...slots?.list },
      }}
    />
  );
}

function BoundWorkspace({
  slots,
}: {
  readonly slots?: LinkedChatWorkspaceSlots | undefined;
}): ReactElement {
  const panel = useChatPanel();
  const phone = useMediaQuery(CHAT_MOBILE_QUERY);
  return (
    <ChatWorkspace
      {...slots}
      conversationId={panel.conversationId}
      view={panel.view === 'history' ? 'list' : 'conversation'}
      onOpen={(conversationId) => {
        panel.selectConversation(conversationId);
        // Opened from the list, the conversation is ready to be answered.
        window.setTimeout(panel.focusComposer, 0);
      }}
      onNew={slots?.onNew ?? (() => panel.selectConversation(null))}
      onBack={() => panel.setView('history')}
      onClose={panel.closeChat}
      onExpand={
        phone
          ? undefined
          : () =>
              panel.setMode(panel.mode === 'expanded' ? 'docked' : 'expanded')
      }
      expanded={panel.mode === 'expanded'}
    />
  );
}

/** Tabs between the two kinds of agent when both are configured, as My sessions switches between kinds of sessions. */
function ModeTabs(): ReactElement {
  const mode = useChatMode();
  const { t } = useChatTranslation();
  if (!mode.switchable)
    return (
      <h2 className='truncate text-base font-semibold'>
        {t('chat.list.label')}
      </h2>
    );
  return (
    <Tabs
      value={mode.mode ?? mode.modes[0]}
      className='min-w-0'
      onValueChange={(next: ConversationMode) => mode.switchTo(next)}
    >
      <TabsList className='w-full min-w-0'>
        {mode.modes.map((item) => (
          <TabsTrigger
            key={item}
            value={item}
            className='min-w-0 flex-auto px-1 text-xs'
          >
            <span className='truncate'>
              {t(item === 'online' ? 'chat.modes.online' : 'chat.modes.runner')}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
