import {
  newConversationAgent,
  useAgentText,
  useChatAgents,
  useChatPanel,
  useConversation,
} from '@nocobase/app-plugin-agents/client/chat';
import { MESSAGE_CONTENT_MAX } from '@nocobase/app-plugin-agents/shared/conversations';
import type { OnlineModelEntry } from '@nocobase/app-plugin-agents/shared/agents';
import { useTranslation } from '@nocobase/i18n/client';
import { STUDIO_NAMESPACE } from '../../shared/access.js';
import {
  ArrowUpIcon,
  BotMessageSquareIcon,
  ListFilterIcon,
} from 'lucide-react';
import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactElement,
} from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '../components/ui/input-group.js';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover.js';
import { ComposerContextChips } from '../components/agent-composer.js';
import { useComposerLabels } from '../extensions/nocobase-agent-chat/chat-i18n.js';
import { chatEditorKey, useChatEditor, useStudioChat } from './chat-state.js';
import { useStudioChatContext } from './use-chat-context.js';

export function HeaderChat({
  mobile = false,
}: {
  readonly mobile?: boolean;
}): ReactElement | null {
  const panel = useChatPanel();
  return panel.available ? <HeaderEditor mobile={mobile} /> : null;
}
function HeaderEditor({
  mobile,
}: {
  readonly mobile: boolean;
}): ReactElement | null {
  const panel = useChatPanel();
  const state = useStudioChat();
  useSyncExternalStore(
    state.top.subscribe,
    state.top.snapshot,
    state.top.snapshot,
  );
  const editorKey = chatEditorKey(
    'panel',
    panel.conversationId,
    state.temporaryKey,
  );
  const editor = useChatEditor(editorKey);
  const agents = useChatAgents();
  const conversation = useConversation(panel.conversationId);
  const text = useAgentText();
  const { t } = useTranslation(STUDIO_NAMESPACE);
  const labels = useComposerLabels();
  const snapshot = useStudioChatContext();
  const content = state.top.read('content', '');
  const setContent = state.top.setter('content', '');
  const chosen = panel.newAgentId
    ? (agents.data?.find((agent) => agent.id === panel.newAgentId) ?? null)
    : newConversationAgent(agents.data, null);
  const target = conversation.data?.agent ?? chosen;
  const name = target ? text.name(target) : t('globalChat.noAgent');
  const description = conversation.data
    ? t('globalChat.continue', { title: conversation.data.title, name })
    : t('globalChat.target', { name });
  const tooLong = [...content].length > MESSAGE_CONTENT_MAX;
  const blocked = state.submissions.blocked(panel.conversationId, editorKey);
  const canSend = Boolean(
    content.trim() &&
    !tooLong &&
    !blocked &&
    target &&
    (!panel.conversationId || conversation.isSuccess),
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasOpenRef = useRef(panel.open);
  useEffect(() => {
    if (wasOpenRef.current && !panel.open && state.fromHeader()) {
      requestAnimationFrame(() => {
        if (inputRef.current?.offsetParent) {
          inputRef.current.focus();
          state.setFromHeader(false);
        }
      });
    }
    wasOpenRef.current = panel.open;
  }, [panel.open, state]);
  function open(): void {
    state.setFromHeader(true);
    panel.openChat();
    panel.focusComposer();
  }
  function transfer(): void {
    if (panel.conversationId && !conversation.isSuccess) {
      open();
      return;
    }
    if (content) {
      editor.beginIntent();
      editor.setter('waiting', false)(false);
      if (editor.hasDraft())
        state.setTransfer({ key: editorKey, text: content });
      else {
        editor.append(content);
        setContent('');
      }
    }
    open();
  }
  function submit(): void {
    if (!canSend) return;
    const model = editor.read<{
      agentId: string;
      model: OnlineModelEntry | null;
    } | null>('model', null);
    const taken = state.submissions.submit({
      content,
      context: snapshot.context,
      attachments: [],
      conversationId: panel.conversationId,
      editorKey,
      create: {
        source: panel.source,
        ...(chosen ? { agentId: chosen.id } : {}),
        ...(chosen && model?.agentId === chosen.id && model.model
          ? { model: model.model }
          : {}),
      },
    });
    if (taken) {
      setContent('');
      panel.clearPinned();
      open();
    }
  }
  if (panel.open) return null;
  return (
    <div
      className={
        mobile
          ? 'group/header relative w-full md:hidden'
          : 'group/header relative hidden shrink-0 md:block'
      }
      data-agents-chat=''
      data-testid={mobile ? 'header-chat-mobile' : 'header-chat-desktop'}
    >
      <InputGroup
        className={
          mobile
            ? 'h-[3rem] w-full bg-accent'
            : 'h-[2.5rem] w-[16rem] bg-accent xl:w-[20rem]'
        }
      >
        <InputGroupAddon className='pl-1'>
          <InputGroupButton
            className='relative size-[2rem]'
            size='icon-sm'
            aria-label={t('globalChat.edit')}
            title={t('globalChat.edit')}
            onClick={transfer}
          >
            <BotMessageSquareIcon />
            {conversation.data?.run ? (
              <span
                className='absolute top-0 right-0 size-2 rounded-full bg-primary'
                aria-hidden='true'
              />
            ) : null}
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupTextarea
          ref={inputRef}
          value={content}
          rows={mobile ? 2 : 1}
          aria-label={t('globalChat.label')}
          aria-invalid={tooLong}
          placeholder={t('globalChat.placeholder')}
          title={description}
          className='h-full min-h-0 min-w-0 resize-none overflow-y-auto py-1 text-sm [field-sizing:fixed]'
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.altKey &&
              !event.nativeEvent.isComposing &&
              event.keyCode !== 229
            ) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <InputGroupAddon align='inline-end' className='pr-1'>
          <InputGroupButton
            size='icon-sm'
            className='size-[2rem]'
            aria-label={t('globalChat.send')}
            disabled={!canSend}
            onClick={submit}
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <Popover>
        <PopoverTrigger
          render={
            <InputGroupButton
              size='icon-sm'
              className='absolute top-full right-0 z-10 size-[2rem] bg-accent opacity-0 group-focus-within/header:opacity-100 focus:opacity-100 [&:hover]:opacity-100'
              aria-label={t('globalChat.preview')}
              title={t('globalChat.preview')}
            />
          }
        >
          <ListFilterIcon />
        </PopoverTrigger>
        <PopoverContent align='end' data-agents-chat=''>
          <p className='mb-2 text-sm break-words'>{description}</p>
          <ComposerContextChips
            chips={snapshot.chips}
            onRemove={snapshot.remove}
            labels={labels}
          />
          {snapshot.truncated ? (
            <p className='mt-2 text-xs text-muted-foreground'>
              {t('globalChat.truncated')}
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
      {tooLong ? (
        <p
          role='alert'
          className='absolute top-full z-10 rounded-md bg-popover p-2 text-xs text-destructive'
        >
          {labels.tooLong.replace('{max}', String(MESSAGE_CONTENT_MAX))}
        </p>
      ) : null}
      {conversation.data?.run ? (
        <span role='status' className='sr-only'>
          {t('globalChat.replying')}
        </span>
      ) : null}
    </div>
  );
}
