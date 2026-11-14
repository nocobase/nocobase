import type { DatabaseManager, DatabaseConnection } from '@nocobase/db';
import {
  configurationGroup,
  createRepositoryLifecycleStore,
  StoredLifecycleParameters,
  type JsonObject,
  type ParameterGroup,
  type ParameterVersion,
  type ParameterUsage,
  type ParameterConfigurationDefinition,
} from '@nocobase/lifecycle';
import {
  officeParameterFields,
  defaultDispatchRules,
} from '../../shared/workflow-parameters.js';
import { OfficeWorkflowValues } from './workflow-parameter-schema.js';
import { OfficeWorkflowParameterService } from './workflow-parameters.js';

export const OFFICE_SNAPSHOTS = 'officeFlowsParameterSnapshots';

/** Contract defaults are versioned source; administrator values are resolved only at record creation. */
export function officeParameterContract(name: string): {
  parameters: JsonObject;
  parameterConfiguration: ParameterConfigurationDefinition;
} {
  const fields = officeParameterFields[name];
  const group: ParameterGroup = {
    key: name,
    title: name,
    schemaVersion: 1,
    fields: Object.fromEntries(
      fields.map((field) => [
        field,
        {
          type: 'object' as const,
          title: field,
          parse: (value: unknown) =>
            OfficeWorkflowValues.parse({ [field]: value })[
              field
            ] as unknown as JsonObject,
        },
      ]),
    ),
  };
  return {
    parameters: Object.fromEntries(
      fields.map((field) => [
        field,
        field === 'dispatchRules' ? defaultDispatchRules(name) : [],
      ]),
    ) as JsonObject,
    parameterConfiguration: {
      groups: [configurationGroup(name, [group])],
    },
  };
}

export class OfficeParameterStore extends StoredLifecycleParameters {
  public constructor(private readonly database: DatabaseManager) {
    super(createRepositoryLifecycleStore(database), {
      heads: 'officeFlowsParameterHeads',
      versions: 'officeFlowsParameterVersions',
      selections: 'officeFlowsParameterSelections',
      requests: 'officeFlowsParameterRequests',
      snapshots: OFFICE_SNAPSHOTS,
      usages: 'officeFlowsParameterUsages',
    });
  }
  public override async readConfiguration(
    scope: string,
    lifecycle: string,
    transaction?: unknown,
  ): Promise<ParameterVersion> {
    const current = await new OfficeWorkflowParameterService(
      this.database,
      transaction as DatabaseConnection | undefined,
    ).read(lifecycle);
    return {
      scope,
      group: lifecycle,
      schemaVersion: 1,
      revision: current.revision,
      values: current.values as JsonObject,
      actorId: '',
      at: new Date().toISOString(),
    };
  }
  // The complete snapshot already carries provenance; office flows have no per-attempt parameter audit API.
  public override saveUsage(
    _usage: ParameterUsage,
    _transaction?: unknown,
  ): Promise<void> {
    return Promise.resolve();
  }
}
