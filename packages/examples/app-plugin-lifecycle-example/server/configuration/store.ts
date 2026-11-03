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
export function exampleParameterRegistration<T extends LifecycleTypes>(
  store: LifecycleParameterStore,
  lifecycle: string,
): ParameterConfigurationRegistration<T> {
  return {
    store: workflowParameterStore(store, lifecycle),
    scope: () => 'demo',
    ...(lifecycle === 'expenses'
      ? {
          legacyRecord: (record: T['record']) => record.parameterContract !== 1,
          snapshotRequired: (record: T['record']) => record.status !== 'draft',
        }
      : {}),
  };
}

/** Configuration belongs to a workflow; historical facts already include its name. */
export function workflowParameterKey(lifecycle: string, group: string): string {
  return `lifecycle.${lifecycle}.${group}`;
}
export function workflowParameterStore(
  store: LifecycleParameterStore,
  lifecycle: string,
): LifecycleParameterStore {
  return {
    read: (scope, group, transaction) =>
      store.read(scope, workflowParameterKey(lifecycle, group), transaction),
    save: (input, transaction) =>
      store.save(
        {
          ...input,
          group: {
            ...input.group,
            key: workflowParameterKey(lifecycle, input.group.key),
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
