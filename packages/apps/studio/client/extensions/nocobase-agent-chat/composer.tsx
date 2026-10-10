/**
 * The chat's message box: `agent-composer` wired to the panel. The page context shows as removable chips inside it (a
 * pinned item is cleared once a message carrying it is taken), a draft from "Ask agent" fills it once, and the panel
 * may focus it. While the agent works, an empty box turns the send button into "Stop"; a message written meanwhile is
 * sent at once and the agent takes it in with the run it is on (or the one waiting for a runner). Files added to it
 * (the attach button, a paste, a drop on it or on the view, through `registerAddFiles`) upload through the agents
 * plugin and go with the message.
 */
import {
  buildPageContext,
  contextChips,
  useChatAttachments,
  useChatPanel,
  useChatSources,
  type ChatContextInput,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  MessageAttachment,
  PageContext,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { useMemo, type ReactElement, type ReactNode } from 'react';
import { useLocation } from 'react-router';

import {
  AgentComposer,
  type AgentComposerAttachments,
  type AgentComposerContext,
} from '@/components/agent-composer';

import { useComposerLabels } from './chat-i18n.js';

export interface ComposerProps {
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
    filter: sources.filter,
    selection: sources.selection,
    removed: sources.removed,
  };
  const context: AgentComposerContext = {
    chips: contextChips(input),
    onRemove: sources.remove,
    build: () => buildPageContext(input),
  };

  return (
    <AgentComposer
      variant={variant}
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
        const taken = onSend(content, carried, sent);
        if (taken) panel.clearPinned();
        return taken;
      }}
    />
  );
}
