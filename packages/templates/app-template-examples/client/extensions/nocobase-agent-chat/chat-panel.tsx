import {
  CHAT_DOCK_QUERY,
  CHAT_MOBILE_QUERY,
  CHAT_PANEL_ATTRIBUTE,
  CHAT_PANEL_ID,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';

import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '#components/ui/dialog';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { createPortal } from 'react-dom';
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';
import { ConversationView } from './conversation-view.js';
import { HistoryList } from './history-list.js';
import { PanelHeader } from './panel-header.js';
import { useMediaQuery } from './use-media-query.js';
import type { ChatInputAvailability } from './input-availability.js';

/** The chat panel; nothing while `ChatProvider` says the panel is not available (signed out, no provider). */
export function ChatPanel({
  inputAvailability,
}: {
  readonly inputAvailability?: ChatInputAvailability;
}): ReactElement | null {
  const panel = useChatPanel();
  return panel.available ? (
    <PanelFrame inputAvailability={inputAvailability} />
  ) : null;
}

function PanelFrame({
  inputAvailability,
}: {
  readonly inputAvailability?: ChatInputAvailability;
}): ReactElement | null {
  const panel = useChatPanel();
  const [mounted, setMounted] = useState(panel.open);
  if (panel.open && !mounted) setMounted(true);
  return mounted ? (
    <MountedPanel inputAvailability={inputAvailability} />
  ) : null;
}

function MountedPanel({
  inputAvailability,
}: {
  readonly inputAvailability?: ChatInputAvailability;
}): ReactElement {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const mobile = useMediaQuery(CHAT_MOBILE_QUERY);
  const wide = useMediaQuery(CHAT_DOCK_QUERY, true);
  const asideRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // One stable React portal owns the body, even when its DOM slot moves between desktop and the phone dialog.
  // Closing a phone dialog or crossing a breakpoint must not destroy drafts, uploads or message state.
  const [body] = useState(() => {
    const element = document.createElement('div');
    element.className = 'flex min-h-0 flex-1 flex-col';
    return element;
  });
  const attachBody = useCallback(
    (slot: HTMLDivElement | null) => {
      slot?.appendChild(body);
    },
    [body],
  );
  const { mode, setMode, closeChat, open } = panel;
  useEffect(() => {
    const element = asideRef.current;
    if (!element || !open) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      if (mode === 'expanded') setMode('docked');
      else closeChat();
    }
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [open, mode, setMode, closeChat, mobile]);
  const marker = { [CHAT_PANEL_ATTRIBUTE]: '' };
  const expanded = mode === 'expanded';
  return (
    <>
      {createPortal(<PanelBody inputAvailability={inputAvailability} />, body)}
      {mobile ? (
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (!next) closeChat();
          }}
        >
          <DialogPortal keepMounted>
            <DialogOverlay hidden={!open} />
            <DialogPrimitive.Popup
              ref={dialogRef}
              initialFocus={dialogRef}
              hidden={!open}
              id={CHAT_PANEL_ID}
              {...marker}
              className='fixed inset-0 z-50 flex h-dvh min-w-0 max-h-dvh w-full flex-col bg-background text-foreground outline-none'
              data-testid='chat-panel'
              data-mode='mobile'
            >
              <DialogTitle className='sr-only'>{t('chat.title')}</DialogTitle>
              <PanelHeader compact />
              <div ref={attachBody} className='flex min-h-0 flex-1 flex-col' />
            </DialogPrimitive.Popup>
          </DialogPortal>
        </Dialog>
      ) : (
        <aside
          ref={asideRef}
          id={CHAT_PANEL_ID}
          {...marker}
          aria-label={t('chat.title')}
          hidden={!open}
          data-mode={expanded ? 'expanded' : wide ? 'docked' : 'floating'}
          data-testid='chat-panel'
          className={cn(
            'flex min-h-0 min-w-0 flex-col bg-background',
            expanded
              ? 'absolute inset-0 z-30'
              : wide
                ? 'relative w-[22rem] shrink-0 border-l 2xl:w-[26.25rem]'
                : 'absolute inset-y-0 right-0 z-30 w-[22rem] max-w-full border-l shadow-xl',
          )}
        >
          <PanelHeader compact={false} />
          <div ref={attachBody} className='flex min-h-0 flex-1 flex-col' />
        </aside>
      )}
    </>
  );
}

function PanelBody({
  inputAvailability,
}: {
  readonly inputAvailability?: ChatInputAvailability;
}): ReactElement {
  const panel = useChatPanel();
  const expanded = panel.mode === 'expanded';
  return (
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col p-3',
        expanded && 'mx-auto w-full max-w-3xl',
      )}
    >
      {panel.view === 'history' ? (
        <div className='min-h-0 flex-1 overflow-y-auto'>
          <HistoryList
            activeId={panel.conversationId}
            onOpen={(id) => {
              panel.selectConversation(id);
              panel.focusComposer();
            }}
            onOpenPage={panel.openPage}
            onNew={() => panel.selectConversation(null)}
          />
        </div>
      ) : (
        <ConversationView
          conversationId={panel.conversationId}
          inputAvailability={inputAvailability}
        />
      )}
    </div>
  );
}
