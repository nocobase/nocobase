/**
 * The chat panel, which the application renders beside its content area (Studio: a sibling of `<main>` inside a
 * `relative flex` row, so it survives page changes). From 1280px it docks beside the content (22rem, 26.25rem from
 * 1536px); between `md` and 1280px it floats over the content's right side (22rem); "full width" covers the content
 * area with the existing history list beside the conversation. Neither is a dialog nor traps focus; Escape restores
 * the width, then closes. Below `md` it is a full-screen dialog. Once opened it stays mounted while closed, so the
 * conversation's subscriptions carry on.
 *
 * It needs `ChatProvider` above it, and a positioned parent: a `relative flex` row beside the content area.
 */
import {
  CHAT_DOCK_QUERY,
  CHAT_MOBILE_QUERY,
  CHAT_PANEL_ATTRIBUTE,
  CHAT_PANEL_ID,
  useChatPanel,
  useConversation,
} from '@nocobase/app-plugin-agents/client/chat';
import { useEffect, useRef, useState, type ReactElement } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';
import { ConversationView } from './conversation-view.js';
import { HistoryList } from './history-list.js';
import { PanelHeader } from './panel-header.js';
import { useMediaQuery } from './use-media-query.js';

/** The chat panel; nothing while `ChatProvider` says the panel is not available (signed out, no provider). */
export function ChatPanel(): ReactElement | null {
  const panel = useChatPanel();
  return panel.available ? <PanelFrame /> : null;
}

function PanelFrame(): ReactElement | null {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const mobile = useMediaQuery(CHAT_MOBILE_QUERY);
  const wide = useMediaQuery(CHAT_DOCK_QUERY, true);
  const [mounted, setMounted] = useState(panel.open);
  const asideRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  if (panel.open && !mounted) setMounted(true);

  const { mode, setMode, setView, focusComposer, closeChat, open } = panel;
  useEffect(() => {
    const element = asideRef.current;
    if (!element || !open) return undefined;
    // A native listener: Escape inside a menu or a select (rendered in a portal) never reaches it.
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      if (mode === 'expanded') {
        setView('chat');
        setMode('docked');
        focusComposer();
      } else closeChat();
    }
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [open, mode, setMode, setView, focusComposer, closeChat, mounted, mobile]);

  if (!mounted) return null;
  const marker = { [CHAT_PANEL_ATTRIBUTE]: '' };

  if (mobile)
    return (
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) closeChat();
        }}
      >
        <DialogContent
          ref={dialogRef}
          // The dialog itself takes the focus on opening: its first control is the title's rename button, whose focus
          // ring would greet every opening, and focusing the box would raise the keyboard over the conversation.
          initialFocus={dialogRef}
          id={CHAT_PANEL_ID}
          {...marker}
          showCloseButton={false}
          className='flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 rounded-none p-0 sm:max-w-none'
          data-testid='chat-panel'
          data-mode='mobile'
        >
          <DialogTitle className='sr-only'>{t('chat.title')}</DialogTitle>
          <PanelHeader compact />
          <PanelBody mobile />
        </DialogContent>
      </Dialog>
    );

  const expanded = mode === 'expanded';
  return (
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
      <PanelBody />
    </aside>
  );
}

function PanelBody({
  mobile = false,
}: {
  readonly mobile?: boolean;
}): ReactElement {
  const { t } = useChatTranslation();
  const panel = useChatPanel();
  const expanded = !mobile && panel.mode === 'expanded';
  const history = panel.view === 'history';
  const bodyRef = useRef<HTMLDivElement>(null);
  const focusIdRef = useRef<string | null>(null);
  const detail = useConversation(panel.conversationId);
  const { conversationId, focusComposer } = panel;
  useEffect(() => {
    // An uncached conversation first renders a skeleton. Focus only after its composer has registered.
    if (detail.data && conversationId === focusIdRef.current) {
      focusIdRef.current = null;
      focusComposer();
    }
  }, [detail.data, conversationId, focusComposer]);
  return (
    <div ref={bodyRef} className='flex min-h-0 min-w-0 flex-1'>
      {expanded || history ? (
        <section
          key='history'
          aria-label={t('chat.history.title')}
          className={cn(
            'min-h-0 min-w-0 overflow-y-auto p-3',
            // A fixed reading column; the conversation takes the remaining width.
            expanded ? 'w-[18rem] shrink-0 border-r' : 'flex-1',
          )}
        >
          <HistoryList
            activeId={panel.conversationId}
            onOpen={(id) => {
              // On a phone the row is removed immediately; keep focus on a visible control during loading or errors.
              bodyRef.current?.parentElement
                ?.querySelector<HTMLButtonElement>(
                  '[data-testid="chat-history-button"]',
                )
                ?.focus();
              focusIdRef.current = id;
              panel.selectConversation(id);
              panel.focusComposer();
            }}
            onOpenPage={panel.openPage}
          />
        </section>
      ) : null}
      {/* Keep this wrapper and its key across size changes: remounting would discard composer drafts and files. */}
      <div
        key='conversation'
        className={cn(
          'min-h-0 min-w-0 flex-1 p-3',
          !expanded && history && 'hidden',
        )}
      >
        {expanded || !history ? (
          <div
            className={cn(
              'flex h-full min-h-0 min-w-0 flex-col',
              expanded && 'mx-auto w-full max-w-3xl',
            )}
          >
            <ConversationView conversationId={panel.conversationId} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
