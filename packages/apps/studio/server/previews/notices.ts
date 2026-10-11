/**
 * What previews tell people through Studio's inbox (source `previews`): the owner of each issue a pull request is linked
 * to hears that a preview of it is ready (with its address) or failed (with why). Notices about the same issue merge
 * into one item per person. The browser words them with the `previews` entry of the inbox registry
 * (`client/inbox/contributions/previews.ts`).
 */
import type { InboxSend } from '../inbox/port.js';
import type { IssueRecord } from './sources.js';

export const PREVIEWS_SOURCE = 'previews';
export const PREVIEW_READY = 'preview_ready';
export const PREVIEW_FAILED = 'preview_failed';

/** The issue's page in Studio. */
export function issuePath(identifier: string): string {
  return `/issues/${encodeURIComponent(identifier)}`;
}

export function previewNotice(
  type: typeof PREVIEW_READY | typeof PREVIEW_FAILED,
  issue: IssueRecord,
  details: {
    readonly previewId: string;
    readonly appId: string;
    /** The linked App it previews; null for the repository itself. */
    readonly targetAppId: string | null;
    readonly pullRequest: { readonly repo: string; readonly number: number };
    readonly url: string | null;
    readonly sha: string | null;
    readonly error?: string | null;
    /** Tells two notices of the same preview apart (a build, a deployment). */
    readonly key: string;
    /** The preview App's environment, where a value every preview there gets is set. */
    readonly environmentId?: string;
    /** A blocked preview's: what its build requires and nothing sets. */
    readonly missingVariables?: readonly string[];
  },
): InboxSend {
  const ready = type === PREVIEW_READY;
  const what = `${details.pullRequest.repo}#${details.pullRequest.number}${details.targetAppId ? ` (${details.targetAppId})` : ''}`;
  return {
    key: `previews:${type}:${issue.id}:${details.key}`,
    source: PREVIEWS_SOURCE,
    kind: 'info',
    type,
    userIds: [issue.ownerUserId],
    title: ready
      ? `The preview of ${what} is ready`
      : `The preview of ${what} failed`,
    body: ready ? (details.url ?? '') : (details.error ?? ''),
    path: issuePath(issue.identifier),
    subject: { type: 'issue', id: issue.id, label: issue.identifier },
    group: `preview:${issue.id}`,
    actor: null,
    data: {
      previewId: details.previewId,
      issueId: issue.id,
      identifier: issue.identifier,
      issueTitle: issue.title,
      appId: details.appId,
      targetAppId: details.targetAppId,
      pullRequest: `${details.pullRequest.repo}#${details.pullRequest.number}`,
      url: details.url,
      sha: details.sha,
      error: details.error ? details.error.slice(0, 2000) : null,
      environmentId: details.environmentId ?? null,
      missingVariables: details.missingVariables
        ? details.missingVariables.join(',')
        : null,
    },
  };
}
