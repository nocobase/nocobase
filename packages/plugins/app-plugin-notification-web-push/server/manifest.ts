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
 * with `createPwaRoutes()`, from `@nocobase/app-server/spa`. Kept with the same output for existing applications.
 */
export const pushManifest: (
  base: string,
  options: PushManifestOptions,
) => PushManifest = pwaManifest;
