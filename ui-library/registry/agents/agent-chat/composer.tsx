/**
 * The chat's message box: `agent-composer` wired to the panel. The page context shows as removable chips inside it (a
 * pinned item is cleared once a message carrying it is taken), a draft from "Ask agent" fills it once, and the panel
 * may focus it. While the agent works, an empty box turns the send button into "Stop"; a message written meanwhile is
 * sent at once and the agent takes it in with the run it is on (or the one waiting for a runner). Files added to it
 * (the attach button, a paste, a drop on it or on the view, through `registerAddFiles`) upload through the agents
 * plugin and go with the message. Clicking a chip shows what it carries (`chipContent`).
 */
import {
  limitBytes,
  useFileUploadLimit,
} from '@nocobase/app-plugin-file/client';
import {
  CapturingPageDraftContext,
  RestoredPageDraftContext,
  buildPageContext,
  contextChips,
  uiItemKey,
  useChatAttachments,
  useChatPanel,
  useChatSources,
  type ChatContextChip,
  type ChatContextInput,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  MessageAttachment,
  PageContext,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  useCallback,
  useContext,
  useState,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router';

import {
  AgentComposer,
  type AgentComposerAttachments,
  type AgentComposerContext,
} from '#components/agent-composer';

import {
  AgentSlotOutlet,
  replaceable,
} from '@nocobase/app-plugin-agents/client/chat';
import { useComposerLabels } from './chat-i18n.js';

export interface ComposerProps {
  readonly disabled?: boolean;
  /** A run is open: the agent is working or waiting for a runner. */
  readonly running: boolean;
  readonly stopping: boolean;
  readonly notice?: ReactNode;
  /** Shown beside the send button, such as the model choice. */
  readonly toolbar?: ReactNode;
  readonly placeholder?: string;
  /** Returns true when the message was taken (it shows at once); the box empties then. */
  readonly onSend: (
    content: string,
    context: PageContext | undefined,
    attachments: readonly MessageAttachment[],
  ) => boolean;
  /** Receives the function that adds files dropped on the view around the box; returns what undoes it. */
  readonly registerAddFiles?: (
    add: (files: readonly File[]) => void,
  ) => () => void;
  readonly onStop: () => void;
  /** `page`: the full-page view's box, one rounded field holding the text and a round send button. */
  readonly variant?: 'panel' | 'page';
  /** The conversation the box writes to, null before its first message; what `composerActions` are given. */
  readonly conversationId?: string | null;
  /** The agent the box writes to, when one is chosen. */
  readonly agentId?: string | null;
  /**
   * Receives the function that puts text into the box (never sending it), for what surrounds it such as the empty
   * state's suggestions; returns what undoes it.
   */
  readonly registerInsert?: (insert: (text: string) => void) => () => void;
}

/** What a chip in the composer carries, as its preview dialog shows it. */
function chipContent(chip: ChatContextChip): unknown {
  switch (chip.kind) {
    case 'selection':
      return chip.selection.text;
    case 'filter':
      return chip.filter;
    case 'item':
      return {
        kind: chip.item.kind,
        id: chip.item.id,
        label: chip.item.label,
      };
    case 'ui':
      return {
        kind: chip.source.kind,
        id: chip.source.id,
        label: chip.source.label,
      };
  }
}

/** The panel's and the conversation page's message box; replaceable as `Composer` (`agents.components.replace`). */
export function DefaultComposer({
  disabled,
  running,
  stopping,
  notice,
  toolbar,
  placeholder,
  onSend,
  onStop,
  variant = 'panel',
  registerAddFiles,
  conversationId = null,
  agentId = null,
  registerInsert,
}: ComposerProps): ReactElement {
  const location = useLocation();
  const panel = useChatPanel();
  // Upload completion must use the current model/executor and readiness, not a captured callback.
  const currentSendRef = useRef(onSend);
  const activeRevisionRef = useRef(panel.composerRevision);
  const sendAllowedRef = useRef(false);
  useLayoutEffect(() => {
    currentSendRef.current = onSend;
    activeRevisionRef.current = panel.composerRevision;
    sendAllowedRef.current = panel.open && !disabled;
    return () => {
      sendAllowedRef.current = false;
    };
  }, [onSend, disabled, panel.open, panel.composerRevision]);
  // The box's own insert, handed to the `composerActions` slot and to `registerInsert`.
  const insertRef = useRef<((text: string) => void) | null>(null);
  const registerBoxInsert = useCallback(
    (insert: (text: string) => void) => {
      insertRef.current = insert;
      const undo = registerInsert?.(insert);
      return () => {
        undo?.();
        if (insertRef.current === insert) insertRef.current = null;
      };
    },
    [registerInsert],
  );
  const insertText = useCallback((text: string) => {
    insertRef.current?.(text);
  }, []);
  const sources = useChatSources();
  const labels = useComposerLabels();
  const files = useChatAttachments();
  const limit = useFileUploadLimit();
  const attachments = useMemo(
    (): AgentComposerAttachments => ({
      maxSize: limitBytes(limit),
      upload: (file, signal) => files.upload(file, signal),
      discard: (attachment) => files.discard(attachment),
      ...(registerAddFiles ? { registerAdd: registerAddFiles } : {}),
    }),
    [files, limit, registerAddFiles],
  );

  const store = useContext(CapturingPageDraftContext);
  const restored = useContext(RestoredPageDraftContext);
  const [usedContext, setUsedContext] = useState(false);
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());
  const carried = !usedContext && restored?.context;
  const input: ChatContextInput = carried
    ? { ...carried, removed: new Set([...carried.removed, ...removed]) }
    : {
        route: `${location.pathname}${location.search}`,
        pinned: panel.pinned,
        sources: sources.items,
        uiSources: sources.uiSources.filter((source) =>
          sources.selectedUIKeys.has(uiItemKey(source)),
        ),
        filter: sources.filter,
        selection: sources.selection,
        removed: sources.removed,
      };
  const inputRef = useRef(input);
  useLayoutEffect(() => {
    inputRef.current = input;
  });
  useLayoutEffect(() => {
    if (!store) return;
    return store.register('context', async () => {
      const saved = inputRef.current;
      const ui = saved.uiSources?.length
        ? await sources.snapshotUI()
        : undefined;
      return { ...saved, ...(ui ? { ui } : {}) };
    });
  }, [store, sources]);
  const context: AgentComposerContext = {
    chips: contextChips(input),
    onRemove: carried
      ? (key) => setRemoved((current) => new Set([...current, key]))
      : sources.remove,
    inspect: chipContent,
    build: () => {
      if (carried) {
        const items = carried.ui?.items.filter(
          (item) => !input.removed.has(uiItemKey(item)),
        );
        const { ui: _ui, ...rest } = input;
        return buildPageContext(
          items?.length ? { ...rest, ui: { version: 1, items } } : rest,
        );
      }
      if (sources.selectedUIKeys.size === 0) return buildPageContext(input);
      return sources.snapshotUI().then((ui) => {
        const latest = inputRef.current;
        if (
          latest.route !== input.route ||
          latest.pinned !== input.pinned ||
          latest.sources !== input.sources ||
          latest.filter !== input.filter ||
          latest.selection !== input.selection ||
          latest.removed !== input.removed
        )
          throw new Error(
            'Page context changed while reading the UI snapshot.',
          );
        return buildPageContext({ ...input, ui });
      });
    },
  };

  return (
    <AgentComposer
      key={panel.composerRevision}
      variant={variant}
      disabled={disabled}
      running={running}
      stopping={stopping}
      notice={notice}
      toolbar={
        <>
          <AgentSlotOutlet
            name='composerActions'
            props={{ conversationId, agentId, insertText }}
          />
          {toolbar ?? null}
        </>
      }
      registerInsert={registerBoxInsert}
      {...(placeholder === undefined ? {} : { placeholder })}
      labels={labels}
      context={context}
      attachments={attachments}
      draft={panel.draft}
      registerFocus={panel.registerComposer}
      onStop={onStop}
      onSend={(content, carried, sent) => {
        if (
          !sendAllowedRef.current ||
          activeRevisionRef.current !== panel.composerRevision
        )
          return false;
        const taken = currentSendRef.current(content, carried, sent);
        if (taken) {
          panel.clearPinned();
          setUsedContext(true);
        }
        return taken;
      }}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- wrapped once at load, so replacements follow it
export const Composer: ComponentType<ComposerProps> = replaceable(
  'Composer',
  DefaultComposer,
);
