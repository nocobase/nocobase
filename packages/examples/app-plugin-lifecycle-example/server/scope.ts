/** The plugin's package name: its jobs scope and its log name. */
export const LIFECYCLE_EXAMPLE_SCOPE: string =
  '@nocobase/app-plugin-lifecycle-example';

/** The collections this plugin's migration creates. */
export const LIFECYCLE_EXAMPLE_COLLECTIONS: {
  readonly tickets: 'lifecycleExampleTickets';
  readonly expenses: 'lifecycleExampleExpenses';
  readonly transitions: 'lifecycleExampleTransitions';
  readonly effectRuns: 'lifecycleExampleEffectRuns';
} = Object.freeze({
  tickets: 'lifecycleExampleTickets',
  expenses: 'lifecycleExampleExpenses',
  transitions: 'lifecycleExampleTransitions',
  effectRuns: 'lifecycleExampleEffectRuns',
});
