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
/** Runtime facts and configuration are both identified by the concrete definition name. */
export function exampleParameterRegistration<T extends LifecycleTypes>(
  store: LifecycleParameterStore,
  _name: string,
): ParameterConfigurationRegistration<T> {
  return { store, scope: () => 'demo' };
}
