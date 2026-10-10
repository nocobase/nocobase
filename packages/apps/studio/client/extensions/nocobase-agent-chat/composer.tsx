/**
 * The chat's message box: `agent-composer` wired to the panel. The page context shows as removable chips inside it (a
 * pinned item is cleared once a message carrying it is taken), a draft from "Ask agent" fills it once, and the panel
 * may focus it. While the agent works, an empty box turns the send button into "Stop"; a message written meanwhile is
 * sent at once and the agent takes it in with the run it is on (or the one waiting for a runner). Files added to it
 * (the attach button, a paste, a drop on it or on the view, through `registerAddFiles`) upload through the agents
 * plugin and go with the message.
 */
import {
  useChatAttachments,
  useChatPanel,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  MessageAttachment,
  PageContext,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { useMemo, type ReactElement, type ReactNode } from 'react';
import { useStudioChatContext } from '../../agents/use-chat-context.js';
import {
  chatEditorKey,
  useChatEditor,
  useStudioChat,
} from '../../agents/chat-state.js';

import {
  AgentComposer,
  type AgentComposerAttachments,
  type AgentComposerContext,
} from '@/components/agent-composer';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@nocobase/i18n/client';
import { STUDIO_NAMESPACE } from '../../../shared/access.js';
import { useComposerLabels } from './chat-i18n.js';

export interface ComposerProps {
  /** A run is open: the agent is working or waiting for a runner. */
  readonly running: boolean;
  readonly conversationId: string | null;
  readonly disabled?: boolean;
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
  conversationId,
  disabled,
  stopping,
  notice,
  toolbar,
  placeholder,
  onSend,
  onStop,
  variant = 'panel',
  registerAddFiles,
}: ComposerProps): ReactElement {
  const panel = useChatPanel();
  const snapshot = useStudioChatContext();
  const state = useStudioChat();
  const editorKey = chatEditorKey(variant, conversationId, state.temporaryKey);
  const editor = useChatEditor(editorKey);
  const labels = useComposerLabels();
  const { t: words } = useTranslation(STUDIO_NAMESPACE);
  const files = useChatAttachments();
  const attachments = useMemo(
    (): AgentComposerAttachments => ({
      upload: (file, signal) => files.upload(file, signal),
      discard: (attachment) => files.discard(attachment),
      ...(registerAddFiles ? { registerAdd: registerAddFiles } : {}),
    }),
    [files, registerAddFiles],
  );

  const context: AgentComposerContext = {
    chips: snapshot.chips,
    onRemove: snapshot.remove,
    build: () => snapshot.context,
  };
  const conflict = state.transfer?.key === editorKey ? state.transfer : null;

  return (
    <>
      {conflict ? (
        <div className='flex flex-wrap gap-2 text-sm' role='status'>
          <p>{words('globalChat.draftConflict')}</p>
          <Button variant='outline' onClick={() => state.setTransfer(null)}>
            {words('globalChat.keepDraft')}
          </Button>
          <Button
            variant='outline'
            onClick={() => {
              editor.append(conflict.text);
              state.top.setter(
                'content',
                '',
              )((value) => (value === conflict.text ? '' : value));
              state.setTransfer(null);
              panel.focusComposer();
            }}
          >
            {words('globalChat.appendDraft')}
          </Button>
        </div>
      ) : null}
      {snapshot.truncated ? (
        <p className='text-xs text-muted-foreground'>
          {words('globalChat.truncated')}
        </p>
      ) : null}
      <AgentComposer
        session={editor}
        disabled={disabled}
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
    </>
  );
}
