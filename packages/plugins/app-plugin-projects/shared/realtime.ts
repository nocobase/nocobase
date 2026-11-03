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
   * The issues that changed, including creation, deletion and list membership changes. Lists must still refresh.
   * Absent, any issue may have changed (for example a visibility or settings change).
   */
  readonly issueIds?: readonly string[];
  /** Known issue changes may also change list membership or project counts. */
  readonly listsChanged?: true;
  /** Only comment threads and activity changed; absent or mixed changes require the full snapshot. */
  readonly discussionOnly?: true;
}

/** Only accept a well-formed, explicitly classified issue announcement. */
export function isDiscussionOnly(payload: unknown): payload is PmChangeEvent & {
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
