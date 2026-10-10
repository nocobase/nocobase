/**
 * Run requests in the browser: work someone asked of an agent on an issue another person owns, waiting for the owner
 * (`server/agents/run-requests.ts`). They live in the agents plugin's API, `/api/agents/runRequests`, which shows a
 * person only the requests they answer for or asked, and decides who may confirm, reject, withdraw or run one:
 *
 * - the owner confirms one (it runs as them, on their runners or a team runner) or rejects it, from its card in their
 *   inbox or under "Waiting for you" on the issue (`client/inbox/contributions/run-requests.ts`);
 * - the person who asked withdraws it or runs it as themselves now, on a runner they may use
 *   (`NO_RUNNER_AVAILABLE` when there is none), from the issue page (`issue-run-requests.tsx`), from the comment box
 *   ("Comment and run as me", `runCommentAsMe`) or from the notice that it expired.
 */
import { useApiClient, type ApiClient } from '@nocobase/app-client';
import { inboxKeys } from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { pmKeys } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import type { RunRequestItem } from '@nocobase/app-plugin-agents/shared/runs';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

export type { RunRequestItem };

export const runRequestKeys = {
  all: ['studio', 'runRequests'] as const,
  one: (id: string) => ['studio', 'runRequests', 'one', id] as const,
  askedOn: (issueId: string) =>
    ['studio', 'runRequests', 'asked', issueId] as const,
};

/** What settling a request does. */
export type RunRequestAction = 'confirm' | 'reject' | 'withdraw' | 'runAsMe';

const path = (id: string, action?: RunRequestAction) =>
  `agents/runRequests/${encodeURIComponent(id)}${action ? `/${action}` : ''}`;

export async function readRunRequest(
  api: ApiClient,
  id: string,
): Promise<RunRequestItem> {
  return (await api.request<{ data: RunRequestItem }>({ path: path(id) })).data;
}

/** The requests the viewer asked on an issue that still wait for its owner, newest first. */
export async function readAskedOn(
  api: ApiClient,
  issueId: string,
): Promise<RunRequestItem[]> {
  return (
    await api.request<{ data: RunRequestItem[] }>({
      path: 'agents/runRequests',
      query: {
        role: 'requester',
        status: 'pending',
        subjectKind: 'issue',
        subjectId: issueId,
        pageSize: '50',
      },
    })
  ).data;
}

export async function settleRunRequest(
  api: ApiClient,
  id: string,
  action: RunRequestAction,
  note?: string,
): Promise<void> {
  await api.request({
    method: 'POST',
    path: path(id, action),
    ...(action === 'reject' ? { json: note ? { note } : {} } : {}),
  });
}

/**
 * "Comment and run as me": the requests the comment `commentId` made of the issue's agents run as the viewer now.
 * Answers how many ran; refused as a whole (`NO_RUNNER_AVAILABLE`) when no runner the viewer may use can run them, in
 * which case they stay with the owner to confirm.
 */
export async function runCommentAsMe(
  api: ApiClient,
  issueId: string,
  commentId: string,
): Promise<number> {
  const asked = (await readAskedOn(api, issueId)).filter((request) => {
    const payload = request.input.payload;
    return (
      typeof payload === 'object' &&
      payload !== null &&
      (payload as { commentId?: unknown }).commentId === commentId
    );
  });
  for (const request of asked)
    await settleRunRequest(api, request.id, 'runAsMe');
  return asked.length;
}

export function useRunRequest(
  id: string | null,
): UseQueryResult<RunRequestItem> {
  const api = useApiClient();
  return useQuery({
    queryKey: runRequestKeys.one(id ?? ''),
    queryFn: () => readRunRequest(api, id ?? ''),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useAskedOn(issueId: string): UseQueryResult<RunRequestItem[]> {
  const api = useApiClient();
  return useQuery({
    queryKey: runRequestKeys.askedOn(issueId),
    queryFn: () => readAskedOn(api, issueId),
    retry: false,
  });
}

/** Settles a request, then reads again what it changes: the requests, the inbox and the issue (with its runs). */
export function useSettleRunRequest(): UseMutationResult<
  void,
  Error,
  {
    readonly id: string;
    readonly action: RunRequestAction;
    readonly note?: string;
  }
> {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }) =>
      settleRunRequest(api, id, action, note),
    onSettled: () => {
      for (const queryKey of [
        runRequestKeys.all,
        inboxKeys.all,
        ['pm', 'issue'],
        pmKeys.issues,
      ])
        void queryClient.invalidateQueries({ queryKey });
    },
  });
}

/** Why the request was made, from its input's trigger, in words. */
export function useWhy(): (request: RunRequestItem) => string {
  const { t } = useTranslation();
  return (request) => {
    const payload = request.input.payload;
    const trigger =
      typeof payload === 'object' && payload !== null
        ? (payload as { trigger?: unknown }).trigger
        : null;
    return t(
      `runRequests.why.${typeof trigger === 'string' ? trigger : 'other'}`,
      { defaultValue: t('runRequests.why.other') },
    );
  };
}
