/**
 * The landing page, with the restraint of the AI products people already know (ChatGPT, Claude.ai, the Codex app): a
 * greeting, one composer (the UI Library's `agent-composer`), and the person's recent conversations under it, nothing
 * else. Inside the composer's toolbar, beside the attach button, the person picks the agent among all they may chat
 * with, grouped by type (Online: a model on the server answers in seconds; Runner: a coding agent on a runtime) with
 * their availability, their default first (`model.ts`), and, for an online agent listing several models, the model it
 * answers with: the chat's `NewChatChoice`, the same pickers a new conversation in the chat panel shows. Files are
 * attached with the button, a paste or a drop on the box and upload as they are added (`useChatAttachments`), as in the
 * chat panel. Sending starts a new conversation with that agent and model, and the first message with its files, whose
 * mode (the agent's type) is then fixed, and opens it full screen (`/chat/:conversationId`, `pages/chat`): one
 * conversation, one composer. A recent conversation opens there too; "All" opens the history in a dialog. Under the
 * composer, "Use Studio in your agent" gives a prompt that sets up the nb-studio CLI in a coding agent (`agent-setup.tsx`).
 * At phone width the composer sticks to the bottom, as in mobile chat apps, under the greeting and the recent
 * conversations.
 *
 * Someone who holds no Studio role yet is told that an administrator has to give them one instead.
 */
import { useChatAttachments } from '@nocobase/app-plugin-agents/client/chat';
import type { OnlineModelEntry } from '@nocobase/app-plugin-agents/shared/agents';
import type {
  ChatAgent,
  ConversationSummary,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CodeXmlIcon, MessageSquareIcon } from 'lucide-react';
import { useMemo, useState, type ReactElement } from 'react';
import { Link, useNavigate } from 'react-router';

import { studioKeys, useStudioApi } from '../../access/api.js';
import { conversationPath } from '../../agents/conversation-path.js';
import { relativeTime } from '@/extensions/nocobase-inbox/model';
import { AgentSetup } from './agent-setup.js';
import { homeKeys, useHomeApi, type HomeStartInput } from './api.js';
import { agentBlocker, chosenAgent, messageOf } from './model.js';

import {
  AgentComposer,
  type AgentComposerAttachments,
} from '@/components/agent-composer';
import { Button } from '@/components/ui/button';
import { NewChatChoice } from '@/extensions/nocobase-agent-chat/agent-choice';
import { useComposerLabels } from '@/extensions/nocobase-agent-chat/chat-i18n';
import { ChatHistoryDialog } from '@/extensions/nocobase-agent-chat/history-list';
import { Spinner } from '@/components/ui/spinner';
import { cn } from 'cn';

const MODE_ICONS = { online: MessageSquareIcon, runner: CodeXmlIcon } as const;

export default function HomePage(): ReactElement | null {
  const { t } = useTranslation();
  const api = useStudioApi();
  const me = useQuery({ queryKey: studioKeys.me, queryFn: () => api.me() });
  if (me.isPending) return null;
  if (me.data && !me.data.superuser && me.data.roles.length === 0)
    return (
      <section className='mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-5xl place-items-center px-6 py-10'>
        <div className='max-w-xl space-y-6 text-center'>
          <h1 className='font-heading text-3xl font-semibold tracking-tight'>
            {t('home.title')}
          </h1>
          <p className='text-muted-foreground'>{t('home.description')}</p>
          <div
            role='status'
            className='rounded-lg border bg-muted/40 px-4 py-3 text-left text-sm'
          >
            <p className='font-medium'>{t('config.noRole.title')}</p>
            <p className='mt-1 text-muted-foreground'>
              {t('config.noRole.description')}
            </p>
          </div>
        </div>
      </section>
    );
  return <Home />;
}

function Home(): ReactElement {
  const { t } = useTranslation();
  const home = useHomeApi();
  const agents = useQuery({
    queryKey: homeKeys.agents,
    queryFn: () => home.agents(),
    // A runner may connect or go offline while this page stays open.
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
  const models = useQuery({
    queryKey: homeKeys.models,
    queryFn: () => home.models(),
  });

  // Phone: the greeting and the recent conversations scroll above the composer, which sticks to the bottom. From `md`:
  // the greeting, the composer and the recent conversations in one column, a little above the middle.
  return (
    <section className='mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 sm:px-6'>
      <h1 className='order-1 flex flex-1 items-center justify-center py-10 text-center font-heading text-2xl font-semibold tracking-tight sm:text-3xl md:flex-none md:pt-[18vh] md:pb-8'>
        {t('home.heading')}
      </h1>
      <div className='sticky bottom-0 order-3 bg-background pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:order-2 md:p-0'>
        {agents.isPending ? (
          <div className='flex h-40 items-center justify-center rounded-2xl border bg-card'>
            <Spinner />
          </div>
        ) : (
          <Composer
            agents={agents.data ?? []}
            modelsOffered={(models.data?.services.length ?? 0) > 0}
          />
        )}
        <div className='mt-2 flex justify-center'>
          <AgentSetup />
        </div>
      </div>
      <div className='order-2 pb-4 md:order-3 md:pt-10 md:pb-10'>
        <Recent />
      </div>
    </section>
  );
}

function Composer({
  agents,
  modelsOffered,
}: {
  readonly agents: readonly ChatAgent[];
  readonly modelsOffered: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const home = useHomeApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const composerLabels = useComposerLabels();
  // The agent picked; until one is, the person's default.
  const [picked, setPicked] = useState<string | null>(null);
  const agent = chosenAgent(agents, picked);
  const blocker = agentBlocker(agent, modelsOffered);
  // Availability checks eligibility, not free slots: busy runners still accept queued messages.
  const runnerUnavailable =
    agent?.type === 'runner' &&
    !agent.availability.online &&
    agent.availability.reason === 'noRunner';

  // Files go up as they are added, through the agents plugin, as in the chat panel's composer.
  const files = useChatAttachments();
  const attachments = useMemo(
    (): AgentComposerAttachments => ({
      upload: (file, signal) => files.upload(file, signal),
      discard: (attachment) => files.discard(attachment),
    }),
    [files],
  );
  // The model an online agent with several answers with, chosen before the first message; another agent starts from
  // its default again.
  const [chosen, setChosen] = useState<{
    readonly agentId: string;
    readonly model: OnlineModelEntry | null;
  } | null>(null);
  const model = agent && chosen?.agentId === agent.id ? chosen.model : null;

  const start = useMutation({
    mutationFn: ({ to, input }: { to: string; input: HomeStartInput }) =>
      home.start(to, input),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: homeKeys.recent });
      void navigate(conversationPath(result.conversation.id));
    },
  });

  const problem = start.isError
    ? t('home.sendFailed')
    : blocker
      ? t(`home.blockers.${blocker}`)
      : runnerUnavailable
        ? t('home.runnerUnavailable')
        : null;

  return (
    <div className='space-y-2'>
      <AgentComposer
        variant='page'
        // The page's main content: about three lines to start with, growing with the text up to the box's limit.
        inputClassName='min-h-20'
        sending={start.isPending}
        disabled={agent === null || blocker !== null}
        placeholder={t(`home.placeholders.${agent?.type ?? 'online'}`)}
        labels={{
          ...composerLabels,
          label: t('home.inputLabel'),
          send: t('home.send'),
        }}
        attachments={attachments}
        onSend={(content, _context, sent) => {
          const message = messageOf(content);
          if (!agent || blocker || (!message && sent.length === 0))
            return false;
          return start
            .mutateAsync({
              to: agent.id,
              input: { content: message ?? '', attachments: sent, model },
            })
            .then(
              () => true,
              () => false,
            );
        }}
        toolbar={
          // The same pickers, in the same order, as a new conversation in the chat panel.
          <NewChatChoice
            agents={agents}
            agent={agent}
            onAgentChange={setPicked}
            model={model}
            onModelChange={(next) => {
              if (agent) setChosen({ agentId: agent.id, model: next });
            }}
          />
        }
      />
      {problem ? (
        <p role='alert' className='px-2 text-center text-sm text-destructive'>
          {problem}
          {!start.isError && blocker === 'noModel' ? (
            <>
              {' '}
              {/* Where models are set up: Agent team › Models. */}
              <Link
                to='/models'
                className='font-medium underline underline-offset-4'
              >
                {t('home.setUpModels')}
              </Link>
            </>
          ) : null}
          {!start.isError && runnerUnavailable ? (
            <>
              {' '}
              <Link
                to='/runtimes'
                className='font-medium underline underline-offset-4'
              >
                {t('home.setUpRunners')}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function Recent(): ReactElement | null {
  const { t, i18n } = useTranslation();
  const home = useHomeApi();
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);
  const recent = useQuery({
    queryKey: homeKeys.recent,
    queryFn: () => home.recent(),
  });
  const items = recent.data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <div className='space-y-1'>
      <div className='flex items-center justify-between px-3'>
        <h2 className='text-sm font-medium text-muted-foreground'>
          {t('home.recent')}
        </h2>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='-mr-2 text-muted-foreground'
          onClick={() => setHistoryOpen(true)}
        >
          {t('home.allConversations')}
        </Button>
      </div>
      <ul aria-label={t('home.recent')}>
        {items.map((conversation) => (
          <RecentItem
            key={conversation.id}
            conversation={conversation}
            locale={i18n.language}
            onOpen={() => void navigate(conversationPath(conversation.id))}
          />
        ))}
      </ul>
      <ChatHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onOpen={(id) => void navigate(conversationPath(id))}
      />
    </div>
  );
}

function RecentItem({
  conversation,
  locale,
  onOpen,
}: {
  readonly conversation: ConversationSummary;
  readonly locale: string;
  readonly onOpen: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const Icon = MODE_ICONS[conversation.mode];
  return (
    <li>
      <button
        type='button'
        onClick={onOpen}
        className='flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none'
      >
        <Icon
          role='img'
          aria-label={t(`home.modes.${conversation.mode}`)}
          className='size-4 shrink-0 text-muted-foreground'
        />
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            !conversation.read && 'font-medium',
          )}
        >
          {conversation.title ?? t('home.untitled')}
        </span>
        <time
          dateTime={conversation.lastMessageAt}
          className='shrink-0 text-xs text-muted-foreground'
        >
          {relativeTime(conversation.lastMessageAt, locale)}
        </time>
      </button>
    </li>
  );
}
