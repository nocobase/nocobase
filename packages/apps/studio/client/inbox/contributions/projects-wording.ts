/**
 * How the projects plugin's notices read in the inbox (source `projects`): the type label, the card's title and
 * sentence, worded by type from the notice's values in the reader's language. Studio's own wording (`inbox.types.*`, `inbox.text.*`, `inbox.body.*`, `inbox.request.*`).
 */
import { ACCESS_NAMESPACE } from '@nocobase/app-plugin-projects/shared/access';
import type { ApprovalRequest } from '@nocobase/app-plugin-projects/shared/approvals';
import type { StatusDefinition } from '@nocobase/app-plugin-projects/shared/issues';
import { hasDefaultName } from '@nocobase/app-plugin-projects/shared/workflows';
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback } from 'react';

import type { InboxEntry } from '@/extensions/nocobase-inbox/model';
import type { EntryText } from '@/extensions/nocobase-inbox/registry';

/** The projects plugin's source in the inbox (`server/inbox/projects.ts`). */
export const PROJECTS_SOURCE = 'projects';

/**
 * The values a projects notice is worded from: `identifier`, `status`, `statusName`, `outcome`, and for comments,
 * mentions and assignments `actorName`, `excerpt`, `source`, `commentId`, `from`, `fromName`. Only strings are kept.
 */
export function paramsOf(entry: InboxEntry): Readonly<Record<string, string>> {
  const data = entry.notice?.data;
  if (!data) return {};
  return Object.fromEntries(
    Object.entries(data).filter(
      (pair): pair is [string, string] => typeof pair[1] === 'string',
    ),
  );
}

/**
 * `paramsOf` with the agent's name in the reader's language: a built-in agent's notice carries its name's i18n key
 * (`agentNameKey`, `agentNameNs`, `server/agents/agent-name.ts`), which words `agentName` and `actorName`.
 */
export function useParamsOf(): (
  entry: InboxEntry,
) => Readonly<Record<string, string>> {
  const { t } = useTranslation();
  return useCallback(
    (entry) => {
      const params = paramsOf(entry);
      const { agentNameKey: key, agentNameNs: ns } = params;
      if (!key || !ns) return params;
      const translate = (fallback: string) =>
        t(key, { ns, defaultValue: fallback });
      return {
        ...params,
        ...(params.agentName ? { agentName: translate(params.agentName) } : {}),
        ...(params.actorName ? { actorName: translate(params.actorName) } : {}),
      };
    },
    [t],
  );
}

/** The types whose item body, as sent, is the issue's title. */
const BODY_IS_ISSUE_TITLE: ReadonlySet<string> = new Set([
  'approval_requested',
  'status_changed',
  'owner_assigned',
  'executor_assigned',
  'dependency_released',
  'batch_done',
]);

/**
 * The title of the issue an item is about, as far as the item tells it, or null. Each card is titled with
 * the issue's title; the projects sender puts that title in the item body, except where the body quotes a comment
 * (`excerpt`), a decision's comment or a workflow's message.
 */
export function issueTitleOf(entry: InboxEntry): string | null {
  const { notice, item } = entry;
  if (!notice || notice.source !== PROJECTS_SOURCE || !item.body) return null;
  if (BODY_IS_ISSUE_TITLE.has(notice.type)) return item.body;
  if (notice.type === 'commented' || notice.type === 'mentioned') {
    const params = paramsOf(entry);
    return !params.excerpt || params.source === 'description'
      ? item.body
      : null;
  }
  return null;
}

/** The key of an item's title: by type, and by what was mentioned, how a request ended, or how many it stands for. */
function titleKey(
  type: string,
  params: Readonly<Record<string, string>>,
  count: number,
): string {
  if (type === 'approval_decided')
    return `inbox.text.approval_decided.${params.outcome ?? ''}`;
  if (type === 'mentioned')
    return `inbox.text.mentioned.${params.source ?? 'comment'}`;
  if (type === 'commented' && count > 1) return 'inbox.text.commented_many';
  if (type === 'batch_done' && params.stage)
    return 'inbox.text.batch_done_stage';
  return `inbox.text.${type}`;
}

/**
 * A status in words: a built-in status that kept its default name as the projects plugin translates it, any other by
 * its name (`name`, or the name in `statuses`), and the key itself when nothing names it.
 */
export function useStatusLabel(): (
  key: string,
  name?: string | null,
  statuses?: readonly StatusDefinition[],
) => string {
  const { t } = useTranslation();
  return (key, name, statuses) => {
    const known =
      name ?? statuses?.find((status) => status.key === key)?.name ?? null;
    if (known !== null && !hasDefaultName({ key, name: known })) return known;
    return t(`status.${key}`, {
      ns: ACCESS_NAMESPACE,
      defaultValue: known ?? key,
    });
  };
}

/**
 * An item's title in the reader's language: worded from its type and values (`inbox.text.*`) when the notice carries
 * them; otherwise the title it was sent with. A built-in status that kept its default name is translated as the
 * projects plugin translates it; someone whose name is unknown reads as "someone".
 */
export function useEntryTitle(): (entry: InboxEntry) => string {
  const { t } = useTranslation();
  const paramsOf = useParamsOf();
  return (entry) => {
    const { notice, item } = entry;
    const params = paramsOf(entry);
    if (!notice || !params.identifier) return item.title;
    const name = params.statusName ?? params.status ?? '';
    const status =
      params.status && hasDefaultName({ key: params.status, name })
        ? t(`status.${params.status}`, {
            ns: ACCESS_NAMESPACE,
            defaultValue: name,
          })
        : name;
    return t(titleKey(notice.type, params, notice.count), {
      ...params,
      identifier: params.identifier,
      status,
      actor: params.actorName ?? t('inbox.someone'),
      count: notice.count,
      defaultValue: item.title,
    });
  };
}

/** What the detail pane knows beyond the item: the issue's title and statuses, and the request being decided. */
export interface EntryContext {
  readonly issueTitle?: string | null;
  readonly statuses?: readonly StatusDefinition[];
  readonly request?: ApprovalRequest | null;
}

/**
 * An item's title and sentence: the issue's title, then one sentence worded by type from
 * the notice's values (`inbox.body.*`). Without the values a sentence needs, the sentence is the
 * worded title (`useEntryTitle`); when that already is the title, the body as sent.
 */
export function useEntryText(): (
  entry: InboxEntry,
  context?: EntryContext,
) => EntryText {
  const { t } = useTranslation();
  const entryTitle = useEntryTitle();
  const statusLabel = useStatusLabel();
  const paramsOf = useParamsOf();
  return (entry, context = {}) => {
    const { item, notice } = entry;
    if (!notice) return { title: item.title, sentence: item.body || null };
    const params = paramsOf(entry);
    const actor = params.actorName ?? t('inbox.someone');
    const status = (key: string | undefined, name?: string) =>
      key ? statusLabel(key, name ?? null, context.statuses) : null;
    const to = status(params.status, params.statusName);

    let sentence: string | null = null;
    switch (notice.type) {
      case 'approval_requested': {
        const request = context.request;
        if (request)
          sentence = t('inbox.request.move', {
            actor: request.requestedByName ?? t('inbox.someone'),
            from: statusLabel(request.fromStatus, null, context.statuses),
            to: statusLabel(request.toStatus, null, context.statuses),
          });
        break;
      }
      case 'status_changed': {
        const from = status(params.from);
        if (from && to)
          sentence = t('inbox.body.status_changed', { actor, from, to });
        break;
      }
      case 'approval_decided':
        if (
          to &&
          (params.outcome === 'approved' || params.outcome === 'rejected')
        )
          sentence = t(
            params.requestedByType
              ? `inbox.body.approval_agent_${params.outcome}`
              : `inbox.body.approval_${params.outcome}`,
            { actor, to },
          );
        break;
      case 'batch_done':
        sentence = params.stage
          ? t('inbox.body.batch_done_stage', { stage: params.stage })
          : t('inbox.body.batch_done');
        break;
      case 'dependency_released':
        if (params.releasedByIdentifier)
          sentence = t('inbox.body.dependency_released', {
            identifier: params.releasedByIdentifier,
          });
        break;
      case 'executor_suggested':
        if (to && params.agentName)
          sentence = t('inbox.body.executor_suggested', {
            identifier: params.identifier,
            status: to,
            agentName: params.agentName,
          });
        break;
      case 'owner_notified':
        // A workflow's keyed message (a template's), in the reader's language; plain text stays the body as sent.
        if (params.messageKey)
          sentence = t(params.messageKey, {
            ...(params.messageNs ? { ns: params.messageNs } : {}),
            defaultValue: params.messageDefault ?? item.body,
          });
        // Without a message the body is the issue's title, which the detail pane already shows as its title.
        else if (item.body && item.body !== context.issueTitle)
          sentence = item.body;
        break;
      case 'run_failed_final':
        if (params.attempts)
          sentence = t('inbox.body.run_failed_final', {
            attempts: params.attempts,
            reason: t(
              `runFailureReasons.${params.failureReason ?? 'unknown'}`,
              {
                defaultValue: params.failureReason ?? '',
              },
            ),
          });
        break;
      case 'agent_blocked':
        sentence = t('inbox.body.agent_blocked', { actor });
        break;
      case 'pr_merged':
        if (params.repo && params.number)
          sentence = t(
            params.actorName
              ? 'inbox.body.pr_merged_by'
              : 'inbox.body.pr_merged',
            { actor, repo: params.repo, number: params.number },
          );
        break;
      case 'approval_stale':
        if (to)
          sentence = params.message
            ? t('inbox.body.approval_stale_why', {
                to,
                message: params.message,
              })
            : t('inbox.body.approval_stale', { to });
        break;
      case 'stage_action_problem':
        if (params.rule && params.reason && to)
          sentence = t('inbox.body.stage_action_problem', {
            rule: t(`inbox.stageRules.${params.rule}`, {
              defaultValue: params.rule,
            }),
            status: to,
            why: t(`inbox.stageSkips.${params.reason}`, {
              defaultValue: params.reason,
            }),
          });
        if (params.reason === 'suppressed')
          sentence += ` ${t('studioAgents.stageRules.continueInIssue')}`;
        break;
      case 'commented':
      case 'mentioned':
      case 'owner_assigned':
      case 'executor_assigned':
        sentence = t(`inbox.body.${notice.type}`, { actor });
        break;
      default:
        break;
    }

    const worded = entryTitle(entry);
    const title = context.issueTitle ?? issueTitleOf(entry) ?? worded;
    if (sentence) return { title, sentence };
    if (title !== worded) return { title, sentence: worded };
    return {
      title,
      sentence: item.body && item.body !== title ? item.body : null,
    };
  };
}

/** What kind of item it is, in words: its type; in the detail pane a decision's own heading when it has one. */
export function useTypeLabel(): (
  entry: InboxEntry,
  where?: 'card' | 'detail',
) => string {
  const { t } = useTranslation();
  return (entry, where = 'card') => {
    const { notice } = entry;
    if (!notice) return t('inbox.tabs.info');
    const label = t(`inbox.types.${notice.type}`, {
      defaultValue: notice.type,
    });
    return where === 'detail' && notice.kind === 'decision'
      ? t(`inbox.titles.${notice.type}`, { defaultValue: label })
      : label;
  };
}
