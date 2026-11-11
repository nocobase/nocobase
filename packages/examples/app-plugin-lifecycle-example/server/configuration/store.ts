import type {
  LifecycleParameterStore,
  LifecycleTypes,
  ParameterConfigurationRegistration,
} from '@nocobase/lifecycle';

export const PARAMETER_COLLECTIONS: Readonly<
  Record<
    'heads' | 'versions' | 'selections' | 'requests' | 'snapshots' | 'usages',
    string
  >
> = {
  heads: 'lifecycleExampleParameterHeads',
  versions: 'lifecycleExampleParameterVersions',
  selections: 'lifecycleExampleParameterSelections',
  requests: 'lifecycleExampleParameterRequests',
  snapshots: 'lifecycleExampleParameterSnapshots',
  usages: 'lifecycleExampleParameterUsages',
};
/**
 * `key` is the process's key: every version of a process reads the one
 * configuration stored under it, while snapshots and usage stay under each
 * record's definition name.
 */
export function exampleParameterRegistration<T extends LifecycleTypes>(
  store: LifecycleParameterStore,
  key: string,
): ParameterConfigurationRegistration<T> {
  return {
    store: workflowParameterStore(store, key),
    scope: () => 'demo',
    ...(key === 'expenses'
      ? {
          legacyRecord: (record: T['record']) => record.parameterContract !== 1,
          snapshotRequired: (record: T['record']) => record.status !== 'draft',
        }
      : {}),
  };
}

/**
 * Configuration belongs to a process, by its key, and every version of it
 * shares it; historical facts already include the definition's name.
 */
export function workflowParameterKey(key: string, group: string): string {
  return `lifecycle.${key}.${group}`;
}
export function workflowParameterStore(
  store: LifecycleParameterStore,
  key: string,
): LifecycleParameterStore {
  return {
    read: (scope, group, transaction) =>
      store.read(scope, workflowParameterKey(key, group), transaction),
    save: (input, transaction) =>
      store.save(
        {
          ...input,
          group: {
            ...input.group,
            key: workflowParameterKey(key, input.group.key),
          },
        },
        transaction,
      ),
    snapshot: (...args) => store.snapshot(...args),
    saveSnapshot: (...args) => store.saveSnapshot(...args),
    usage: (...args) => store.usage(...args),
    saveUsage: (...args) => store.saveUsage(...args),
    listUsage: (...args) => store.listUsage(...args),
  };
}
