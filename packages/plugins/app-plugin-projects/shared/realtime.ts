/**
 * What the server announces when this plugin's data changes. The event names only the kind of data, never a record:
 * every open page refetches what it shows, and the server decides what each viewer may see.
 */
export const PM_REALTIME_TOPIC = 'pm:changes';

export type PmChangeDomain = 'issues' | 'labels' | 'workflows' | 'plans';

export interface PmChangeEvent {
  readonly kind: 'pm.changed';
  readonly domain: PmChangeDomain;
}
