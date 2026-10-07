import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '../../shared/ui/button.js';
import { LoadingState } from '../../shared/loading-state.js';
import {
  useAIChatBase,
  useAIChatMessages,
  useAIChatStatus,
  type AIChatMessage,
  type AIToolCallDecision,
} from '../../providers/index.js';
import { cn } from '../../shared/utils.js';
import { ArrowDown } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ChatEmptyState } from './chat-empty-state.js';
import { ChatMessage } from './chat-message.js';

export function ChatMessages({
  onToolCallDecision,
}: {
  onToolCallDecision?: (decision: AIToolCallDecision) => void | Promise<void>;
}) {
  const { messages } = useAIChatMessages();
  const { status, error } = useAIChatStatus();
  const {
    messagesLoading,
    historyError,
    interactionError,
    retryMessage,
    decideToolCall,
    startEditingMessage,
    focusComposer,
  } = useAIChatBase();

  return (
    <AIChatMessageList
      messages={messages}
      status={status}
      loading={messagesLoading}
      error={error}
      historyError={historyError}
      interactionError={interactionError}
      onToolCallDecision={onToolCallDecision}
      retryMessage={retryMessage}
      decideToolCall={decideToolCall}
      startEditingMessage={startEditingMessage}
      focusComposer={focusComposer}
    />
  );
}

export type AIChatMessageListProps = {
  messages: AIChatMessage[];
  status?: 'submitted' | 'streaming' | 'ready' | 'error';
  loading?: boolean;
  error?: Error | null;
  historyError?: Error | null;
  interactionError?: Error | null;
  emptyState?: ReactNode;
  /** Content such as a load-earlier control, rendered inside the scrolling history. */
  historyHeader?: ReactNode;
  className?: string;
  onToolCallDecision?: (decision: AIToolCallDecision) => void | Promise<void>;
  /** Hiding message actions also disables interactive tool and subagent rendering. */
  showMessageActions?: boolean;
  /** Render history without mounting interactive tool renderers or task controls. */
  readOnly?: boolean;
  retryMessage?: (message: AIChatMessage) => Promise<void>;
  decideToolCall?: (decision: AIToolCallDecision) => Promise<void>;
  startEditingMessage?: (message: AIChatMessage) => Promise<void>;
  focusComposer?: () => void;
};

type ScrollSnapshot = {
  first?: Element;
  last?: Element;
  anchor?: Element;
  anchorTop: number;
  scrollTop: number;
  scrollHeight: number;
};

export function AIChatMessageList({
  messages,
  status = 'ready',
  loading = false,
  error,
  historyError,
  interactionError,
  emptyState,
  historyHeader,
  className,
  onToolCallDecision,
  showMessageActions = true,
  readOnly = false,
  retryMessage,
  decideToolCall,
  startEditingMessage,
  focusComposer,
}: AIChatMessageListProps) {
  const { t } = useTranslation('@nocobase/app-plugin-ai-employee');
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<ScrollSnapshot | null>(null);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const hasContent = Boolean(
    messages.length ||
    historyHeader ||
    emptyState ||
    error ||
    historyError ||
    interactionError ||
    (!readOnly && showMessageActions),
  );

  const capturePosition = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rows = Array.from(messageListRef.current?.children ?? []);
    const viewportTop = viewport.getBoundingClientRect().top;
    const anchor = rows.find(
      (row) => row.getBoundingClientRect().bottom > viewportTop,
    );
    snapshotRef.current = {
      first: rows[0],
      last: rows.at(-1),
      anchor,
      anchorTop: anchor ? anchor.getBoundingClientRect().top - viewportTop : 0,
      scrollTop: viewport.scrollTop,
      scrollHeight: viewport.scrollHeight,
    };
  }, []);

  const updateAtBottom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const next =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 48;
    atBottomRef.current = next;
    setAtBottom(next);
  }, []);

  const scrollToBottom = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const reducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    viewport.focus({ preventScroll: true });
    viewport.scrollTo({
      top: Math.max(0, viewport.scrollHeight - viewport.clientHeight),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  const restorePosition = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const previous = snapshotRef.current;
    const rows = messageListRef.current?.children;
    const first = rows?.[0];
    const isNewHistory =
      first &&
      (!previous?.first ||
        (!viewport.contains(previous.first) &&
          !viewport.contains(previous.last ?? null)));
    const prepended =
      previous?.first &&
      first !== previous.first &&
      viewport.contains(previous.first);

    // A prepend must take precedence over tail-follow, even for a short history
    // that previously fitted in the viewport. Anchor a row, not total height:
    // the tail can stream and the history header can change in the same commit.
    if (isNewHistory || (atBottomRef.current && !prepended)) {
      viewport.scrollTop = Math.max(
        0,
        viewport.scrollHeight - viewport.clientHeight,
      );
    } else if (previous) {
      if (previous.anchor && viewport.contains(previous.anchor)) {
        viewport.scrollTop +=
          previous.anchor.getBoundingClientRect().top -
          viewport.getBoundingClientRect().top -
          previous.anchorTop;
      } else {
        viewport.scrollTop =
          previous.scrollTop +
          (prepended ? viewport.scrollHeight - previous.scrollHeight : 0);
      }
    }
    updateAtBottom();
    capturePosition();
  }, [capturePosition, updateAtBottom]);

  // Restore content changes before paint, not the state render caused by a
  // scroll event: merely approaching the bottom must not snap the reader there.
  useLayoutEffect(() => {
    restorePosition();
  }, [
    messages,
    status,
    loading,
    historyHeader,
    emptyState,
    error,
    historyError,
    interactionError,
    readOnly,
    showMessageActions,
    restorePosition,
  ]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || typeof ResizeObserver === 'undefined') return;

    // Observe content too: images, tools and streamed Markdown can grow without
    // changing the viewport size or causing this component to render.
    const observer = new ResizeObserver(() => restorePosition());
    observer.observe(viewport);
    if (content) observer.observe(content);
    return () => observer.disconnect();
  }, [loading, hasContent, restorePosition]);

  return (
    <div
      className={cn(
        'relative min-h-0 min-w-0 flex-1 overflow-hidden bg-background',
        className,
      )}
    >
      <div
        ref={viewportRef}
        role='log'
        aria-label={t('chat.messageHistory', 'Message history')}
        aria-live='polite'
        tabIndex={0}
        className='absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain scroll-auto [overflow-anchor:none] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'
        onScroll={() => {
          updateAtBottom();
          capturePosition();
        }}
      >
        {loading ? (
          <LoadingState className='h-full' />
        ) : hasContent ? (
          <div ref={contentRef} className='flex min-h-full flex-col'>
            {historyHeader}
            {messages.length ? (
              <div
                ref={messageListRef}
                className='mx-auto min-w-0 w-full max-w-3xl py-2'
              >
                {messages.map((message) => (
                  <div key={message.id} data-chat-message-id={message.id}>
                    <ChatMessage
                      message={message}
                      onToolCallDecision={onToolCallDecision}
                      showActions={showMessageActions && !readOnly}
                      readOnly={readOnly || !showMessageActions}
                      status={status}
                      retryMessage={retryMessage}
                      decideToolCall={decideToolCall}
                      startEditingMessage={startEditingMessage}
                      focusComposer={focusComposer}
                    />
                  </div>
                ))}
              </div>
            ) : (
              (emptyState ??
              (readOnly || !showMessageActions ? null : (
                <div className='flex flex-1 flex-col justify-center'>
                  <ChatEmptyState />
                </div>
              )))
            )}
            {error ? (
              <div
                role='alert'
                className='mx-5 my-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive'
              >
                {error.message}
              </div>
            ) : null}
            {historyError ? (
              <div
                role='alert'
                className='mx-5 my-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive'
              >
                {historyError.message}
              </div>
            ) : null}
            {interactionError ? (
              <div
                role='alert'
                className='mx-5 my-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive'
              >
                {interactionError.message}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {!atBottom ? (
        <Button
          size='icon-sm'
          variant='outline'
          className='absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background shadow-sm'
          aria-label={t('chat.scrollToBottom', 'Scroll to bottom')}
          onClick={() => scrollToBottom()}
        >
          <ArrowDown aria-hidden='true' />
        </Button>
      ) : null}
    </div>
  );
}
