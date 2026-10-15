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
   * deleted, restored, owner or status changed). Absent, any issue may have changed.
   */
  readonly issueIds?: readonly string[];
}
