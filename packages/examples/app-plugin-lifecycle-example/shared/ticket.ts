/** Category keys; the pages translate them. */
export const TICKET_CATEGORIES: readonly string[] = [
  'account',
  'billing',
  'howto',
  'incident',
];

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export const PRIORITIES: readonly Priority[] = [
  'low',
  'normal',
  'high',
  'urgent',
];
