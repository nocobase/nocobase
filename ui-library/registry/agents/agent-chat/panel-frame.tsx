import { resolveAppUrl } from '@nocobase/app-client';
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
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router';
import { Dialog, DialogContent, DialogTitle } from '#components/ui/dialog';
import { cn } from 'cn';
import { useMediaQuery } from './use-media-query.js';
import { useKeyboardFit } from './use-keyboard-fit.js';

export function ConversationPanelFrame({
  children,
  title,
  preferComposer = false,
}: {
  readonly children: ReactNode;
  readonly title: string;
  readonly preferComposer?: boolean;
}): ReactElement | null {
  const panel = useChatPanel();
  const mobile = useMediaQuery(CHAT_MOBILE_QUERY);
  const wide = useMediaQuery(CHAT_DOCK_QUERY, true);
  const [mounted, setMounted] = useState(panel.open);
  const asideRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // On a phone the panel ends where the soft keyboard begins, so its composer stays above it.
  const fitKeyboard = useKeyboardFit();
  const dialogElement = useCallback(
    (element: HTMLDivElement | null) => {
      dialogRef.current = element;
      fitKeyboard(element);
    },
    [fitKeyboard],
  );
  if (panel.open && !mounted) setMounted(true);

  const { mode, setMode, setView, focusComposer, closeChat, open } = panel;
  const { pathname } = useLocation();
  const previousPathRef = useRef(pathname);
  const expandedPathRef = useRef<string | null>(null);
  useEffect(() => {
    const changed = previousPathRef.current !== pathname;
    previousPathRef.current = pathname;
    if (mode !== 'expanded') {
      expandedPathRef.current = null;
      return;
    }
    if (expandedPathRef.current === null) {
      // A guarded navigation can update the browser address before publishing its route.
      // Expanding during that interval belongs to the destination already requested.
      expandedPathRef.current = window.location.pathname;
      return;
    }
    // Route navigation exposes its destination; query-only conversation selection stays expanded.
    if (changed && resolveAppUrl(pathname) !== expandedPathRef.current)
      setMode('docked');
  }, [pathname, mode, setMode]);
  useEffect(() => {
    const element = asideRef.current;
    // Configuration can still be loading before either composer registers its focus target.
    // Keep Escape reachable during that interval without taking focus from an already-ready composer.
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
          ref={dialogElement}
          // The dialog itself takes the focus on opening: its first control is the title's rename button, whose focus
          // ring would greet every opening, and focusing the box would raise the keyboard over the conversation.
          initialFocus={() =>
            preferComposer
              ? (dialogRef.current?.querySelector<HTMLTextAreaElement>(
                  'textarea',
                ) ?? dialogRef.current)
              : dialogRef.current
          }
          id={CHAT_PANEL_ID}
          {...marker}
          showCloseButton={false}
          // Pinned to the top rather than centred: the keyboard fit shortens it from the bottom, so its composer ends
          // where the keyboard begins.
          className='top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none'
          data-testid='chat-panel'
          data-mode='mobile'
        >
          <DialogTitle className='sr-only'>{title}</DialogTitle>
          {children}
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
      aria-label={title}
      hidden={!open}
      data-mode={expanded ? 'expanded' : wide ? 'docked' : 'floating'}
      data-testid='chat-panel'
      className={cn(
        'flex min-h-0 min-w-0 flex-col overflow-hidden bg-background outline-none',
        expanded
          ? 'absolute inset-0 z-30'
          : wide
            ? 'relative w-[22rem] shrink-0 border-l 2xl:w-[26.25rem]'
            : 'absolute inset-y-0 right-0 z-30 w-[22rem] max-w-full border-l shadow-xl',
      )}
    >
      {children}
    </aside>
  );
}
