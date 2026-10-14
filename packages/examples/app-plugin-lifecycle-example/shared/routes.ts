/**
 * Where this plugin's routes start, relative to the API base: the plugin's
 * namespace, and so the domain of its errors. Every server route, the
 * client's requests and its lifecycle hook all read it, so they cannot drift
 * apart.
 */
export const LIFECYCLE_ROUTES: string = 'lifecycleExample';

/**
 * The realtime topic every page of this plugin listens on. A push names the
 * record that changed and nothing else; the page reads it back through its
 * signed-in routes, so the topic can be public.
 */
export const LIFECYCLE_CHANGES_TOPIC: string = 'lifecycle-example:changes';

/** What a push says: which record changed. */
export interface LifecycleChange {
  readonly lifecycle: string;
  readonly recordId: string;
}
