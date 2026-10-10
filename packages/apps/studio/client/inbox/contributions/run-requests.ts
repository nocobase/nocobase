/**
 * The inbox entries of run requests on issues (source `runRequests`, sent by `server/agents/run-requests.ts`):
 *
 * - `run_request`: a decision for the issue's owner. Someone else asked an agent to work on their issue (a comment, a
 *   status moved into a stage, a finished sub-issue or dependency, the previous owner's work): it runs as them once
 *   they confirm it, or they reject it. It is about the issue, so it is also under "Waiting for you" on the issue's
 *   page, where its card shows the request in full (`Brief`).
 * - `run_request_expired`: the person who asked hears nobody confirmed it in time, or the issue's new owner cannot run
 *   it; they may still run it as themselves.
 *
 * Both load the request itself (`GET /api/agents/runRequests/:id`), which the agents plugin shows only to the person
 * who answers for it and the person who asked, and which says whether it still waits; the agents plugin also decides
 * who may confirm, reject or run it. Every item opens the issue.
 */
import { useViewer } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { HandIcon, TimerOffIcon } from 'lucide-react';

import {
  isSettled,
  kindOf,
  type InboxEntry,
} from '@/extensions/nocobase-inbox/model';
import {
  defineInboxRenderer,
  type InboxCanAct,
} from '@/extensions/nocobase-inbox/registry';

import {
  RUN_REQUEST_EXPIRED_TYPE,
  RUN_REQUEST_TYPE,
  RUN_REQUESTS_SOURCE,
} from '../../../shared/run-requests.js';
import { useRunRequest } from '../../agents/run-requests.js';
import { field } from './releases.locales.js';
import {
  RunRequestActions,
  RunRequestBody,
  RunRequestBrief,
  type RunRequestModel,
} from './run-requests-parts.js';

const typeOf = (entry: InboxEntry) => entry.notice?.type ?? RUN_REQUEST_TYPE;

function useModel(entry: InboxEntry): RunRequestModel {
  const query = useRunRequest(
    field(entry, 'requestId') ?? entry.notice?.decisionKey ?? null,
  );
  return {
    request: query.data,
    isPending: query.isPending,
    error: query.error,
  };
}

function useCanAct(entry: InboxEntry, model: RunRequestModel): InboxCanAct {
  const { t } = useTranslation();
  const viewer = useViewer();
  const request = model.request;
  if (typeOf(entry) === RUN_REQUEST_EXPIRED_TYPE) {
    if (model.isPending || !viewer) return { state: 'loading' };
    return request?.status === 'expired' &&
      !request.runId &&
      request.requestedByUserId === viewer.userId
      ? { state: 'yes' }
      : { state: 'none' };
  }
  if (kindOf(entry) !== 'decision' || isSettled(entry))
    return { state: 'none' };
  if (model.isPending || !viewer) return { state: 'loading' };
  if (!request || request.status !== 'pending') return { state: 'none' };
  return request.responsibleUserId === viewer.userId
    ? { state: 'yes' }
    : { state: 'no', reason: t('runRequests.onlyOwner') };
}

export const runRequestsRenderer = defineInboxRenderer<RunRequestModel>({
  source: RUN_REQUESTS_SOURCE,
  types: [RUN_REQUEST_TYPE, RUN_REQUEST_EXPIRED_TYPE],
  icon: (entry) =>
    typeOf(entry) === RUN_REQUEST_EXPIRED_TYPE ? TimerOffIcon : HandIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: (entry, where) =>
        typeOf(entry) === RUN_REQUEST_EXPIRED_TYPE
          ? t('runRequests.expiredLabel')
          : where === 'detail'
            ? t('runRequests.labelDetail')
            : t('runRequests.label'),
      text: (entry) => {
        const values = {
          name: field(entry, 'requestedByName') ?? '',
          agent: field(entry, 'agentName') ?? '',
          identifier: field(entry, 'identifier') ?? '',
        };
        if (typeOf(entry) === RUN_REQUEST_EXPIRED_TYPE)
          return {
            title: t('runRequests.expiredTitle', values),
            sentence: t(
              `runRequests.expiredSentence.${field(entry, 'reason') === 'reassignment' ? 'reassignment' : 'timeout'}`,
            ),
          };
        return {
          title: t('runRequests.title', values),
          sentence: field(entry, 'excerpt') ?? t('runRequests.sentence'),
        };
      },
      outcome: (outcome) =>
        t(`runRequests.outcomes.${outcome}`, { defaultValue: outcome }),
      open: t('runRequests.open'),
    };
  },
  useModel,
  useCanAct,
  Actions: RunRequestActions,
  Body: RunRequestBody,
  Brief: RunRequestBrief,
  context: (entry) => {
    const issueId = field(entry, 'issueId');
    return issueId ? { ids: [issueId] } : {};
  },
});
