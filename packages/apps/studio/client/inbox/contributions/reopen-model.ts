/** The issues a reopen suggestion lists (`server/deploys/service.ts`, `ReopenIssue`), read from its data. */
import type { InboxEntry } from '@/extensions/nocobase-inbox/model';

export interface ReopenIssueItem {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
}

export function reopenIssues(entry: InboxEntry): readonly ReopenIssueItem[] {
  const value = entry.notice?.data?.issues;
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const record = item as Readonly<Record<string, unknown>>;
    return typeof record.id === 'string' &&
      typeof record.identifier === 'string'
      ? [
          {
            id: record.id,
            identifier: record.identifier,
            title: typeof record.title === 'string' ? record.title : '',
          },
        ]
      : [];
  });
}
