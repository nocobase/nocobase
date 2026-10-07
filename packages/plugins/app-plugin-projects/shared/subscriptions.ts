/** Who follows an issue and why. Following brings its comments and status changes to the inbox. */

export const SUBSCRIPTION_REASONS = [
  'creator',
  'owner',
  'executor',
  'commenter',
  'mentioned',
  'manual',
] as const;
export type SubscriptionReason = (typeof SUBSCRIPTION_REASONS)[number];

export interface IssueSubscriber {
  readonly userId: string;
  readonly name: string;
  readonly reason: SubscriptionReason;
}

/** `POST /api/projects/issues/{issueId}/subscribe` and `/unsubscribe`. */
export interface SubscriptionState {
  readonly subscribed: boolean;
}
