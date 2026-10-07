/**
 * Driver forms: how a deployment driver's settings are shown as a form instead of JSON. The plugin binds the registry
 * (`releasesDriverFormsToken`) and registers the Host driver's form. An application that registers another driver adds
 * its form in a service provider's `boot()`:
 *
 * ```ts
 * class MyDriverFormsProvider extends ServiceProvider<ClientApplication> {
 *   public override boot(): Promise<void> {
 *     if (this.app.container.has(releasesDriverFormsToken))
 *       this.app.container.resolve(releasesDriverFormsToken).register(myDriverForm);
 *     return Promise.resolve();
 *   }
 * }
 * ```
 *
 * A driver without a form keeps the JSON editors.
 */
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { DriverFormDescription, DriverFormRegistry } from './types.js';

export type * from './types.js';
export {
  commandText,
  decodeDriverForm,
  encodeDriverForm,
  getPath,
  isFieldShown,
  matches,
  parseMap,
  pathTarget,
  type DriverFormOutput,
  type DriverFormSource,
  type DriverFormState,
  type SecretInput,
} from './mapping.js';
export { hostDriverForm } from './host.js';

export const releasesDriverFormsToken: ServiceToken<DriverFormRegistry> =
  createServiceToken<DriverFormRegistry>(
    '@nocobase/app-plugin-releases/driver-forms',
  );

export function createDriverFormRegistry(
  initial: readonly DriverFormDescription[] = [],
): DriverFormRegistry {
  const forms = new Map<string, DriverFormDescription>();
  const registry: DriverFormRegistry = {
    register(form) {
      if (forms.has(form.kind))
        throw new Error(`A form for the driver "${form.kind}" is registered.`);
      forms.set(form.kind, form);
      return () => {
        if (forms.get(form.kind) === form) forms.delete(form.kind);
      };
    },
    get: (kind) => forms.get(kind),
  };
  for (const form of initial) registry.register(form);
  return registry;
}
