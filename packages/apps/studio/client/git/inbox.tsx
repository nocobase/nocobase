/**
 * Studio's pull request items in the inbox (source `git`, `server/git/cards.ts`): "waiting to be merged", a decision for
 * the owner of an issue in review, shows the pull request as it is now (state, checks, conflicts) with Merge and Mark as
 * merged; "needs you" tells the owner that a signal stopped waking the agent. Both open the issue.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { AlertTriangleIcon, GitMergeIcon } from 'lucide-react';

import {
  GIT_INBOX_SOURCE,
  PR_MERGE_REQUESTED,
  PR_SIGNAL_STOPPED,
} from '../../shared/git.js';
import { isSettled, kindOf } from '@/extensions/nocobase-inbox/model';
import { defineInboxRenderer } from '@/extensions/nocobase-inbox/registry';
import {
  field,
  labelOf,
  pullRequestOf,
  useGitModel,
  type GitModel,
} from './inbox-model.js';
import { GitActions, GitBody } from './inbox-parts.js';

export const gitRenderer = defineInboxRenderer<GitModel>({
  source: GIT_INBOX_SOURCE,
  types: [PR_MERGE_REQUESTED, PR_SIGNAL_STOPPED],
  icon: (entry) =>
    entry.notice?.type === PR_SIGNAL_STOPPED ? AlertTriangleIcon : GitMergeIcon,
  useWording() {
    const { t } = useTranslation();
    return {
      label: (entry, where) =>
        where === 'detail' && entry.notice?.type === PR_MERGE_REQUESTED
          ? t('studioGit.inbox.heading')
          : t('studioGit.inbox.type'),
      text: (entry) => ({
        title: t(
          entry.notice?.type === PR_SIGNAL_STOPPED
            ? 'studioGit.inbox.stoppedTitle'
            : 'studioGit.inbox.title',
          {
            identifier: field(entry, 'identifier') ?? '?',
            label: labelOf(entry),
          },
        ),
        sentence: field(entry, 'title'),
        sentenceHref: field(entry, 'url'),
      }),
      outcome: (outcome) =>
        t(`studioGit.inbox.outcomes.${outcome}`, { defaultValue: outcome }),
      open: t('studioGit.inbox.open'),
    };
  },
  useModel: useGitModel,
  // The registry calls it as a hook; this one needs none.
  // eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix
  useCanAct: (entry, model) => {
    if (kindOf(entry) !== 'decision' || isSettled(entry))
      return { state: 'none' };
    if (model.pullRequests.isLoading) return { state: 'loading' };
    const pullRequest = pullRequestOf(entry, model);
    return model.pullRequests.data?.canMerge && pullRequest?.state === 'open'
      ? { state: 'yes' }
      : { state: 'none' };
  },
  Actions: GitActions,
  Body: GitBody,
  context: (entry) => {
    const issueId = field(entry, 'issueId');
    return issueId
      ? {
          ids: [issueId],
          ask: {
            kind: 'issue',
            id: issueId,
            label: field(entry, 'identifier') ?? issueId,
          },
        }
      : {};
  },
});
