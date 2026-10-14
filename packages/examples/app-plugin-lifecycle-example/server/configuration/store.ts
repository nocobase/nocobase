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
    store,
    scope: () => 'demo',
    ...(lifecycle === 'expenses'
      ? {
          legacyRecord: (record: T['record']) => record.parameterContract !== 1,
          snapshotRequired: (record: T['record']) => record.status !== 'draft',
        }
      : {}),
  };
}
