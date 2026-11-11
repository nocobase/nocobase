import {
  pwaManifest,
  type PwaManifest,
  type PwaManifestOptions,
} from '@nocobase/app-server/spa';

/** @deprecated Use `PwaManifestOptions` from `@nocobase/app-server/spa`. */
export type PushManifestOptions = PwaManifestOptions;
/** @deprecated Use `PwaManifest` from `@nocobase/app-server/spa`. */
export type PushManifest = PwaManifest;
/**
 * @deprecated Installation no longer depends on this plugin: use `pwaManifest`, or the `pwa` configuration section
 * with `createPwaRoutes()`, from `@nocobase/app-server/spa`. Kept for existing applications: `id`, `start_url`, `scope` and relative icons are unchanged; absolute icon URLs are no longer prefixed with the base path.
 */
export const pushManifest: (
  base: string,
  options: PushManifestOptions,
) => PushManifest = pwaManifest;
