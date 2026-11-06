/** Presentation priority only; admission, recovery and run ownership stay with the chat controller. */
export type ChatNoticeKind =
  'notSent' | 'waiting' | 'runtime' | 'agent' | 'review';

export interface ChatNoticeConditions {
  readonly notSent?: boolean;
  readonly waiting?: boolean;
  readonly runtime?: boolean;
  readonly agent?: boolean;
  readonly review?: boolean;
}

/** The composer has one actionable notice, ordered by what the person needs to handle next. */
export function chatNoticeKind(
  conditions: ChatNoticeConditions,
): ChatNoticeKind | null {
  if (conditions.notSent) return 'notSent';
  if (conditions.waiting) return 'waiting';
  if (conditions.runtime) return 'runtime';
  if (conditions.agent) return 'agent';
  if (conditions.review) return 'review';
  return null;
}
