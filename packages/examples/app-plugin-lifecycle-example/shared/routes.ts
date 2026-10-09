/**
 * Where this plugin's routes start, relative to the API base: the plugin's
 * namespace, and so the domain of its errors. Every server route, the
 * client's requests and its lifecycle hook all read it, so they cannot drift
 * apart.
 */
export const LIFECYCLE_ROUTES: string = 'lifecycleExample';
