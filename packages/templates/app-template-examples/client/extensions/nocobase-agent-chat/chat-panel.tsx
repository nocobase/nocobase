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
import { useLocation } from 'react-router';
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';
import { useChatMode } from './chat-mode.js';
import { ConversationView } from './conversation-view.js';
import { HistoryList } from './history-list.js';
import { PanelHeader, PanelHistoryHeader } from './panel-header.js';
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
  const { mode, setMode, setView, closeChat, open } = panel;
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  useEffect(() => {
    const changed = pathRef.current !== pathname;
    pathRef.current = pathname;
    // Another page from the navigation: show it beside the panel rather than under it.
    if (changed && mode === 'expanded') setMode('docked');
  }, [pathname, mode, setMode]);
  useEffect(() => {
    const element = asideRef.current;
    // The panel takes the focus as it opens, so Escape reaches it while the agents are still loading; a composer that
    // is ready takes it from there.
    if (open && !mobile && element && !element.contains(document.activeElement))
      element.focus();
  }, [open, mobile]);
  useEffect(() => {
    const element = asideRef.current;
    if (!element || !open) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      if (mode === 'expanded') {
        setView('chat');
        setMode('docked');
      } else closeChat();
    }
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [open, mode, setMode, setView, closeChat, mobile]);
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
          tabIndex={-1}
          id={CHAT_PANEL_ID}
          {...marker}
          aria-label={t('chat.title')}
          hidden={!open}
          data-mode={expanded ? 'expanded' : wide ? 'docked' : 'floating'}
          data-testid='chat-panel'
          className={cn(
            'flex min-h-0 min-w-0 flex-col bg-background outline-none',
            expanded
              ? 'absolute inset-0 z-30'
              : wide
                ? 'relative w-[22rem] shrink-0 border-l 2xl:w-[26.25rem]'
                : 'absolute inset-y-0 right-0 z-30 w-[22rem] max-w-full border-l shadow-xl',
          )}
        >
          {expanded ? (
            // Covering the content: the conversation list on the left, the conversation and its header on the right.
            <div
              className='flex min-h-0 min-w-0 flex-1'
              data-testid='chat-split'
            >
              <section
                className='flex w-[18rem] shrink-0 flex-col border-r bg-muted/30'
                data-panel-history=''
              >
                <PanelHistory header={<PanelHistoryHeader />} />
              </section>
              <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
                <PanelHeader compact={false} />
                <div
                  ref={attachBody}
                  className='flex min-h-0 flex-1 flex-col'
                />
              </div>
            </div>
          ) : (
            <>
              <PanelHeader compact={false} />
              <div ref={attachBody} className='flex min-h-0 flex-1 flex-col' />
            </>
          )}
        </aside>
      )}
    </>
  );
}

function PanelHistory({
  header,
}: {
  readonly header?: ReactElement;
}): ReactElement {
  const panel = useChatPanel();
  const chat = useChatMode();
  return (
    <HistoryList
      header={header}
      mode={chat.mode}
      activeId={panel.conversationId}
      onOpen={(id) => {
        panel.selectConversation(id);
        panel.focusComposer();
      }}
      onOpenPage={panel.openPage}
      onNew={chat.startNew}
    />
  );
}

function PanelBody({
  inputAvailability,
}: {
  readonly inputAvailability?: ChatInputAvailability;
}): ReactElement {
  const panel = useChatPanel();
  const mobile = useMediaQuery(CHAT_MOBILE_QUERY);
  // While covering the content the list has a column of its own, so the body is the conversation alone.
  const split = panel.mode === 'expanded' && !mobile;
  if (!split && panel.view === 'history')
    return (
      <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <PanelHistory />
      </div>
    );
  return (
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col p-3',
        split && 'mx-auto w-full max-w-3xl',
      )}
    >
      <ConversationView
        conversationId={panel.conversationId}
        inputAvailability={inputAvailability}
      />
    </div>
  );
}
