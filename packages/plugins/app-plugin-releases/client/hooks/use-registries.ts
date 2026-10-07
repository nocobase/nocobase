/** The image registries (`GET releases/registries`), for the registries tab and the environment form. */
import type { RegistryRecord } from '../../shared/releases.js';
import { useLoad, useReleasesApi, type Loaded } from './use-releases.js';

/** Loads nothing while `enabled` is false (an environment whose driver runs no images). */
export function useRegistries(
  enabled = true,
): Loaded<readonly RegistryRecord[]> {
  const api = useReleasesApi();
  return useLoad(
    () =>
      enabled
        ? api.list<RegistryRecord>('registries').then((page) => page.items)
        : Promise.resolve([]),
    `registries:${String(enabled)}`,
  );
}
