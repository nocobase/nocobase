/**
 * The agents plugin's chat, joined to the projects plugin: Studio assembles both, so it joins them here (neither imports
 * the other). The panel, the conversation page and the launchers are the UI Library's agent-chat block, installed in
 * `extensions/nocobase-agent-chat/` and placed by the layout; what they read comes from the plugin's provider here.
 *
 * - `StudioChat` wraps the application's routes (`layouts/app-layout.tsx`) in the panel's provider, which knows the
 *   full-page view of a conversation (`/chat/:conversationId`, `pages/chat`) for its "Open full screen", with the panel's
 *   extensions: the operation plans an agent proposed in a conversation (`source.key` `conversation:<id>`) show among
 *   its messages as the UI Library's plan cards (`extensions/nocobase-plan-card`), to review, edit, execute and undo there; and the news of a decided
 *   plan (`news` of type `planDecided`) reads in the viewer's language, while a milestone of work the conversation
 *   delegated (`news` of type `delegation`) shows as an event card (`delegation/card.tsx`).
 * - What a page shows becomes the panel's context: the projects kit's page-context provider collects what the pages
 *   register and hands it to the panel (`page-context.tsx`); the issue or project a route opens is registered too
 *   (`RouteChatContext`), for pages that register nothing. The panel shows each object once.
 * - The kit's slot is filled: the AI draft tab's "Let an agent organize" (`intake-agent.tsx`); plans a status rule
 *   proposed are worded in the reader's language (`plan-wording.tsx`).
 * - Under an agent's reply, cards of the issues, projects and knowledge documents it mentions (`reference-cards.tsx`).
 *
 * The panel renders under the agents plugin's query cache. A plan card needs the projects plugin's cache, which the
 * server's plan announcements refresh, so the cache above `StudioChat` is handed to the cards explicitly.
 */
import {
  ChatExtensionsContext,
  ChatProvider,
  useChatContextSource,
  type ChatExtensions,
  type ChatTimelineItem,
} from '@nocobase/app-plugin-agents/client/chat';
import {
  IntakeAgentSlotContext,
  type IntakeAgentSlotFill,
  PageContextProvider,
  pmKeys,
  usePlanApi,
  usePmApi,
} from '@nocobase/app-plugin-projects/client/kit';
import {
  QueryClientProvider,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useMemo,
  type ReactElement,
  type ReactNode,
} from 'react';
import { matchPath, useLocation } from 'react-router';

import type { ConversationMessage } from '@nocobase/app-plugin-agents/shared/conversations';

import { PlanCard } from '@/extensions/nocobase-plan-card/plan-card';

import { conversationPath } from './conversation-path.js';
import { Organize } from './intake-agent.js';
import { renderDelegationNews } from './delegation/news.js';
import { studioNewsText } from './news.js';
import { PageContextToChat } from './page-context.js';
import { StudioPlanWording } from './plan-wording.js';
import { ReferenceCards } from './reference-cards.js';
import { StudioChatStateProvider } from './chat-state.js';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';

/** How many of a conversation's plans the panel shows. */
const PLAN_LIMIT = 20;

/** The projects plugin's query cache, as `StudioChat` found it. */
const PmQueryClientContext = createContext<QueryClient | null>(null);

/** The plans proposed in a conversation, refetched whenever its messages, its run or a plan change. */
function useConversationPlans(
  conversationId: string,
  revision: number,
): readonly ChatTimelineItem[] {
  const pmClient = useContext(PmQueryClientContext);
  const api = usePlanApi();
  const plans = useQuery(
    {
      queryKey: ['pm', 'plans', 'conversation', conversationId, revision],
      queryFn: () =>
        api.plans({
          sourceKey: `conversation:${conversationId}`,
          limit: PLAN_LIMIT,
        }),
      enabled: conversationId !== '',
      placeholderData: (previous) => previous,
      retry: false,
    },
    pmClient ?? undefined,
  );
  return useMemo(
    () =>
      (plans.data?.data ?? []).map((plan): ChatTimelineItem => {
        const card = <PlanCard planId={plan.id} plan={plan} />;
        return {
          key: `plan-${plan.id}`,
          at: plan.createdAt,
          node: pmClient ? (
            <QueryClientProvider client={pmClient}>{card}</QueryClientProvider>
          ) : (
            card
          ),
        };
      }),
    [plans.data, pmClient],
  );
}

/** The reference cards under an agent's reply, under the projects plugin's cache like the plan cards. */
function MessageReferences({
  content,
}: {
  readonly content: string;
}): ReactElement {
  const pmClient = useContext(PmQueryClientContext);
  const cards = <ReferenceCards content={content} />;
  return pmClient ? (
    <QueryClientProvider client={pmClient}>{cards}</QueryClientProvider>
  ) : (
    cards
  );
}

function messageExtra(message: ConversationMessage): ReactNode {
  return message.role === 'assistant' ? (
    <MessageReferences content={message.content.content} />
  ) : null;
}

const extensions: ChatExtensions = {
  useTimelineItems: useConversationPlans,
  renderMessageExtra: messageExtra,
  newsText: studioNewsText,
  renderNews: renderDelegationNews,
};
const intakeAgentSlot: IntakeAgentSlotFill = { Organize };

// An issue's page at its own address and under the other lists that open it (`issueDetailRoute` in `routes.ts`).
const ISSUE_PATHS = [
  '/issues/:issueId/*',
  '/my-issues/:tab/:issueId/*',
  '/projects/:projectId/issues/:issueId/*',
];
const PROJECT_PATHS = ['/projects/:projectId/*'];
/** Paths under `/issues`, `/my-issues` and `/projects` that are pages of their own, not a record. */
const OWN_PAGES: ReadonlySet<string> = new Set([
  'new',
  'new-issue',
  'intake',
  'plans',
]);

function paramOf(
  pathname: string,
  patterns: readonly string[],
  name: string,
): string | null {
  for (const pattern of patterns) {
    const value = matchPath(pattern, pathname)?.params[name];
    if (value && !OWN_PAGES.has(value)) return value;
  }
  return null;
}

/**
 * The issue or project the current route opens, as the panel's context, for pages that register nothing themselves;
 * the pages' own entries come through `PageContextToChat`, and the panel shows an object both name once.
 */
function RouteChatContext(): null {
  const { pathname } = useLocation();
  const api = usePmApi();
  const issueParam = paramOf(pathname, ISSUE_PATHS, 'issueId');
  const projectParam = issueParam
    ? null
    : paramOf(pathname, PROJECT_PATHS, 'projectId');
  const issue = useQuery({
    queryKey: pmKeys.issue(issueParam ?? ''),
    queryFn: () => api.issue(issueParam ?? ''),
    enabled: issueParam !== null,
    retry: false,
  });
  const project = useQuery({
    queryKey: pmKeys.project(projectParam ?? ''),
    queryFn: () => api.project(projectParam ?? ''),
    enabled: projectParam !== null,
    retry: false,
  });
  const issueData = issueParam ? issue.data : undefined;
  const projectData = projectParam ? project.data : undefined;
  useChatContextSource(
    issueData
      ? {
          kind: 'issue',
          id: issueData.id,
          label: `${issueData.identifier} ${issueData.title}`,
        }
      : projectData
        ? { kind: 'project', id: projectData.id, label: projectData.name }
        : null,
  );
  return null;
}

export function StudioChat({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  const pmClient = useQueryClient();
  const { session } = useAuthentication();
  return (
    <ChatProvider conversationPath={conversationPath}>
      <ChatExtensionsContext.Provider value={extensions}>
        <PmQueryClientContext.Provider value={pmClient}>
          <PageContextProvider>
            <PageContextToChat />
            <RouteChatContext />
            <StudioPlanWording>
              <IntakeAgentSlotContext.Provider value={intakeAgentSlot}>
                <StudioChatStateProvider key={session?.user.id ?? 'signed-out'}>
                  {children}
                </StudioChatStateProvider>
              </IntakeAgentSlotContext.Provider>
            </StudioPlanWording>
          </PageContextProvider>
        </PmQueryClientContext.Provider>
      </ChatExtensionsContext.Provider>
    </ChatProvider>
  );
}
