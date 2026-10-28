/**
 * What the server announces when this plugin's data changes, once for the events of a moment. The event names the kind
 * of data and, for issues, at most which issues changed (their ids, never their content): an open page refetches what
 * it shows of them, and the server decides what each viewer may see.
 */
export const PM_REALTIME_TOPIC = 'pm:changes';

export type PmChangeDomain = 'issues' | 'labels' | 'plans';

export interface PmChangeEvent {
  readonly kind: 'pm.changed';
  readonly domain: PmChangeDomain;
  /**
   * The issues that changed, when every change named one and none moved an issue into or out of a list (created,
   * deleted, restored, owner, status, project, parent or executor changed). Absent, any issue may have changed, and
   * which issues a list or a project holds may have changed too.
   */
  readonly issueIds?: readonly string[];
  /** Only comment threads and activity changed; absent or mixed changes require the full snapshot. */
  readonly discussionOnly?: true;
}

/** Only accept a well-formed, explicitly classified issue announcement. */
export function isDiscussionOnly(
  payload: unknown,
): payload is PmChangeEvent & {
  readonly discussionOnly: true;
  readonly issueIds: readonly string[];
} {
  const change = payload as Partial<PmChangeEvent> | null;
  return (
    change?.kind === 'pm.changed' &&
    change.domain === 'issues' &&
    change.discussionOnly === true &&
    Array.isArray(change.issueIds) &&
    change.issueIds.length > 0 &&
    change.issueIds.every((id) => typeof id === 'string' && id.length > 0)
  );
}
