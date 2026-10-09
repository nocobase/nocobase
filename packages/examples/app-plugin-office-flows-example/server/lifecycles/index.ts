import type { LifecycleRuntime } from '@nocobase/lifecycle';

import type { OfficeStore } from '../services/store.js';
import { dataRequestLifecycle } from './data-request.js';
import { extractionLifecycle } from './extraction.js';
import { incomingLifecycle } from './incoming.js';
import {
  clerkTaskLifecycle,
  executorTaskLifecycle,
  teamTaskLifecycle,
} from './tasks.js';

/**
 * Registers the six lifecycles. Their services are bound to the transition's
 * transaction while a guard runs, and to the database otherwise.
 */
export function registerLifecycles(
  runtime: LifecycleRuntime,
  store: OfficeStore,
): void {
  const services = (handle: unknown): { store: OfficeStore } => ({
    store: store.bound(handle),
  });
  runtime.register(dataRequestLifecycle, { services });
  runtime.register(extractionLifecycle, { services });
  runtime.register(incomingLifecycle, { services });
  runtime.register(clerkTaskLifecycle, { services });
  runtime.register(teamTaskLifecycle, { services });
  runtime.register(executorTaskLifecycle, { services });
}
