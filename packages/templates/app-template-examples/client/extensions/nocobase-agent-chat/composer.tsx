import {
  buildPageContext,
  contextChips,
  uiItemKey,
  useChatAttachments,
  useChatPanel,
  useChatSources,
  type ChatContextInput,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  MessageAttachment,
  PageContext,
} from '@nocobase/app-plugin-agents/shared/conversations';
import {
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router';

import {
  AgentComposer,
  type AgentComposerAttachments,
  type AgentComposerContext,
} from '#components/agent-composer';

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
}

export function Composer({
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
}: ComposerProps): ReactElement {
  const location = useLocation();
  const panel = useChatPanel();
  // Upload completion may retain an older onSend closure. Consult current readiness and identity/mount state.
  const currentSendRef = useRef(onSend);
  const sendAllowedRef = useRef(false);
  useLayoutEffect(() => {
    currentSendRef.current = onSend;
    sendAllowedRef.current = panel.open && !disabled;
    return () => {
      sendAllowedRef.current = false;
    };
  }, [onSend, disabled, panel.open]);
  const sources = useChatSources();
  const labels = useComposerLabels();
  const files = useChatAttachments();
  const attachments = useMemo(
    (): AgentComposerAttachments => ({
      upload: (file, signal) => files.upload(file, signal),
      discard: (attachment) => files.discard(attachment),
      ...(registerAddFiles ? { registerAdd: registerAddFiles } : {}),
    }),
    [files, registerAddFiles],
  );

  const input: ChatContextInput = {
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
  const context: AgentComposerContext = {
    chips: contextChips(input),
    onRemove: sources.remove,
    build: () => {
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
      variant={variant}
      disabled={disabled}
      running={running}
      stopping={stopping}
      notice={notice}
      toolbar={toolbar}
      {...(placeholder === undefined ? {} : { placeholder })}
      labels={labels}
      context={context}
      attachments={attachments}
      draft={panel.draft}
      registerFocus={panel.registerComposer}
      onStop={onStop}
      onSend={(content, carried, sent) => {
        if (!sendAllowedRef.current) return false;
        const taken = currentSendRef.current(content, carried, sent);
        if (taken) panel.clearPinned();
        return taken;
      }}
    />
  );
}
