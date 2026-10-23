/**
 * The chat panel, which the application renders beside its content area (for example, a sibling of `<main>` inside a
 * `relative flex` row, so it survives page changes). From 1280px it docks beside the content (22rem, 26.25rem from
 * 1536px); between `md` and 1280px it floats over the content's right side (22rem); "full width" covers the content
 * area, with the conversation list in a column on its left and the conversation on the right; following a link to
 * another page brings it back to its usual width. Neither is a dialog nor traps focus: it takes the focus when it
 * opens (the composer takes it from there once it is ready), and Escape restores the width, then closes. Below `md`
 * it is a full-screen dialog. Once opened it stays mounted while closed, so the conversation's subscriptions carry on.
 *
 * It shows one kind of agent at a time, online or runner agents, each with its own conversations (`useChatMode`).
 *
 * It needs `ChatProvider` above it, and a positioned parent: a `relative flex` row beside the content area.
 */
import {
  CHAT_DOCK_QUERY,
  CHAT_MOBILE_QUERY,
  CHAT_PANEL_ATTRIBUTE,
  CHAT_PANEL_ID,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useLocation } from 'react-router';

import { Dialog, DialogContent, DialogTitle } from '#components/ui/dialog';
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';
import { ConversationView } from './conversation-view.js';
import { useChatMode } from './chat-mode.js';
import { HistoryList } from './history-list.js';
import { PanelHeader, PanelHistoryHeader } from './panel-header.js';
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
  }, [open, mobile, mounted]);
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
      } else closeChat();
    }
    element.addEventListener('keydown', onKeyDown);
    return () => element.removeEventListener('keydown', onKeyDown);
  }, [open, mode, setMode, setView, closeChat, mounted, mobile]);

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
          className='flex h-dvh min-w-0 max-h-dvh w-full max-w-none flex-col gap-0 rounded-none p-0 sm:max-w-none'
          data-testid='chat-panel'
          data-mode='mobile'
        >
          <DialogTitle className='sr-only'>{t('chat.title')}</DialogTitle>
          <PanelHeader compact />
          <PanelBody split={false} />
        </DialogContent>
      </Dialog>
    );

  const expanded = mode === 'expanded';
  return (
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
        <SplitBody />
      ) : (
        <>
          <PanelHeader compact={false} />
          <PanelBody split={false} />
        </>
      )}
    </aside>
  );
}

/** Covering the content: the conversation list in a column on the left, the conversation and its header on the right. */
function SplitBody(): ReactElement {
  return (
    <div className='flex min-h-0 min-w-0 flex-1' data-testid='chat-split'>
      <section
        className='flex w-[18rem] shrink-0 flex-col border-r bg-muted/30'
        data-panel-history=''
      >
        <PanelHistory header={<PanelHistoryHeader />} />
      </section>
      <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <PanelHeader compact={false} />
        <PanelBody split />
      </div>
    </div>
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
    />
  );
}

function PanelBody({ split }: { readonly split: boolean }): ReactElement {
  const panel = useChatPanel();
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
      <ConversationView conversationId={panel.conversationId} />
    </div>
  );
}
