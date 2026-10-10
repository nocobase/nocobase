/** The plugin's package name: its jobs scope and its log name. */
export const LIFECYCLE_EXAMPLE_SCOPE: string =
  '@nocobase/app-plugin-lifecycle-example';

/** The collections this plugin's migration creates. */
export const LIFECYCLE_EXAMPLE_COLLECTIONS: {
  readonly tickets: 'lifecycleExampleTickets';
  readonly expenses: 'lifecycleExampleExpenses';
  readonly orders: 'lifecycleExampleOrders';
  readonly exports: 'lifecycleExampleExports';
  readonly purchases: 'lifecycleExamplePurchases';
  readonly fulfilments: 'lifecycleExampleFulfilments';
  readonly subscriptions: 'lifecycleExampleSubscriptions';
  readonly transitions: 'lifecycleExampleTransitions';
  readonly effectRuns: 'lifecycleExampleEffectRuns';
  readonly sandboxObjects: 'lifecycleExampleSandboxObjects';
  readonly webhookEvents: 'lifecycleExampleWebhookEvents';
} = Object.freeze({
  tickets: 'lifecycleExampleTickets',
  expenses: 'lifecycleExampleExpenses',
  orders: 'lifecycleExampleOrders',
  exports: 'lifecycleExampleExports',
  purchases: 'lifecycleExamplePurchases',
  fulfilments: 'lifecycleExampleFulfilments',
  subscriptions: 'lifecycleExampleSubscriptions',
  transitions: 'lifecycleExampleTransitions',
  effectRuns: 'lifecycleExampleEffectRuns',
  sandboxObjects: 'lifecycleExampleSandboxObjects',
  webhookEvents: 'lifecycleExampleWebhookEvents',
});
