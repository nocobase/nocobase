import { useClientApplication } from '@nocobase/app-client';

import {
  createDriverFormRegistry,
  hostDriverForm,
  releasesDriverFormsToken,
} from '../driver-forms/index.js';
import type { DriverFormRegistry } from '../driver-forms/types.js';

/** Without the plugin's service provider (an application routing the pages alone), only the Host form. */
const fallback: DriverFormRegistry = createDriverFormRegistry([hostDriverForm]);

/** The driver forms the application's plugins registered. */
export function useDriverForms(): DriverFormRegistry {
  const { services } = useClientApplication();
  return services.has(releasesDriverFormsToken)
    ? services.resolve(releasesDriverFormsToken)
    : fallback;
}
