import { officeParameterFields } from '../../shared/workflow-parameters.js';
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

export const officeWorkflowDefinitions: readonly {
  readonly name: string;
  readonly collection: string;
  readonly stateField: string;
}[] = [
  dataRequestLifecycle,
  extractionLifecycle,
  incomingLifecycle,
  clerkTaskLifecycle,
  teamTaskLifecycle,
  executorTaskLifecycle,
].map(({ name, collection, stateField }) => ({ name, collection, stateField }));

/**
 * Registers the six lifecycles. Their services are bound to the transition's
 * transaction while a guard runs, and to the database otherwise.
 */
export function registerLifecycles(
  runtime: LifecycleRuntime,
  store: OfficeStore,
): void {
  const parameterStore = store.parameterStore();
  const configuration = (name: string) =>
    officeParameterFields[name]
      ? {
          parameterConfiguration: {
            store: parameterStore,
            scope: () => 'office',
          },
        }
      : {};
  store.attachRuntime(runtime);
  const services = (handle: unknown): { store: OfficeStore } => ({
    store: store.bound(handle),
  });
  runtime.register(dataRequestLifecycle, {
    services,
    ...configuration('dataRequests'),
  });
  runtime.register(extractionLifecycle, { services });
  runtime.register(incomingLifecycle, {
    services,
    ...configuration('incoming'),
  });
  runtime.register(clerkTaskLifecycle, {
    services,
    ...configuration('clerkTasks'),
  });
  runtime.register(teamTaskLifecycle, {
    services,
    ...configuration('teamTasks'),
  });
  runtime.register(executorTaskLifecycle, { services });
}
