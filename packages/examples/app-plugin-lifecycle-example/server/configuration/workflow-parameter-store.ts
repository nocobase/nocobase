import {
  StoredLifecycleParameters,
  ParameterConfigurationError,
  normalizeParameterValues,
  type LifecycleStore,
  type ParameterGroup,
  type ParameterVersion,
  type SaveParameterVersion,
  type JsonObject,
} from '@nocobase/lifecycle';
import { parameterWorkflows } from './workflows.js';
import { PARAMETER_COLLECTIONS } from './store.js';

export const WORKFLOW_PARAMETERS = 'lifecycleExampleWorkflowParameters';

export function workflowParameterGroup(name: string): ParameterGroup {
  const workflow = parameterWorkflows.find((item) => item.name === name);
  if (!workflow)
    throw new ParameterConfigurationError(
      'CONFIGURATION_INVALID',
      'Unknown workflow.',
    );
  const groups = workflow.parameterConfiguration!.groups;
  return {
    key: `lifecycle.${name}`,
    title: name,
    schemaVersion: 1,
    fields: Object.fromEntries(
      groups.flatMap((group) => Object.entries(group.fields)),
    ),
    validate: (values) => {
      for (const group of groups)
        normalizeParameterValues(
          group,
          Object.fromEntries(
            Object.keys(group.fields).map((key) => [key, values[key]]),
          ),
        );
    },
  };
}

/** Current configuration is one CAS-protected row per workflow. Execution facts retain their existing storage. */
export class WorkflowParameterStore extends StoredLifecycleParameters {
  public constructor(private readonly records: LifecycleStore) {
    super(records, PARAMETER_COLLECTIONS);
  }
  public override read(
    scope: string,
    key: string,
    transaction?: unknown,
  ): Promise<ParameterVersion | undefined> {
    const [, name, groupKey] = key.split('.');
    return this.records.transaction(
      async (store) => {
        const row = await store.findRecord(
          WORKFLOW_PARAMETERS,
          `lifecycle.${name}`,
        );
        if (!row || row.scope !== scope) return undefined;
        const version = {
          scope,
          group: `lifecycle.${name}`,
          revision: Number(row.revision),
          schemaVersion: 1,
          values: row.values as JsonObject,
          actorId: String(row.actorId),
          at: String(row.at),
        };
        if (!groupKey) return version;
        const group = parameterWorkflows
          .find((item) => item.name === name)
          ?.parameterConfiguration?.groups.find(
            (item) => item.key === groupKey,
          );
        if (!group)
          throw new ParameterConfigurationError(
            'CONFIGURATION_INVALID',
            'Unknown workflow parameter group.',
          );
        return {
          ...version,
          group: key,
          schemaVersion: group.schemaVersion,
          values: Object.fromEntries(
            Object.keys(group.fields).map((field) => [
              field,
              version.values[field],
            ]),
          ),
        };
      },
      transaction === undefined ? undefined : { within: transaction },
    );
  }
  public override async save(
    input: SaveParameterVersion,
    transaction?: unknown,
  ): Promise<ParameterVersion> {
    const [, name, groupKey] = input.group.key.split('.');
    const group = workflowParameterGroup(name);
    const workflow = parameterWorkflows.find((item) => item.name === name)!;
    const conflict = () =>
      new ParameterConfigurationError(
        'CONFIGURATION_CONFLICT',
        'The workflow parameter revision changed. Reload before saving.',
      );
    const result = await this.records.transaction(
      async (store) => {
        const id = group.key;
        let row = await store.findRecord(WORKFLOW_PARAMETERS, id);
        if (!row) {
          if (input.expectedRevision !== 0) throw conflict();
          try {
            await store.transaction(
              async (nested) => {
                await nested.createRecord(WORKFLOW_PARAMETERS, {
                  id,
                  scope: input.scope,
                  status: 'current',
                  revision: 0,
                  values: workflow.parameters,
                  actorId: '',
                  at: '',
                });
              },
              { within: store.transactionHandle },
            );
          } catch (error) {
            if (await store.findRecord(WORKFLOW_PARAMETERS, id))
              throw conflict();
            throw error;
          }
          row = await store.findRecord(WORKFLOW_PARAMETERS, id);
        }
        if (row!.scope !== input.scope) throw conflict();
        const previous = {
          scope: input.scope,
          group: id,
          revision: Number(row!.revision),
          schemaVersion: 1,
          values: row!.values as JsonObject,
          actorId: String(row!.actorId),
          at: String(row!.at),
        };
        const values = normalizeParameterValues(group, {
          ...previous.values,
          ...input.values,
        });
        const fingerprint = JSON.stringify(
          Object.keys(values)
            .sort()
            .map((key) => [key, values[key]]),
        );
        if (row!.requestId === input.requestId) {
          if (
            row!.fingerprint !== fingerprint ||
            previous.actorId !== input.actorId
          )
            throw new ParameterConfigurationError(
              'CONFIGURATION_REQUEST_REUSED',
              'This request ID was already used with different input.',
            );
          return previous;
        }
        const revision = input.expectedRevision + 1;
        const version: ParameterVersion = {
          scope: input.scope,
          group: id,
          schemaVersion: 1,
          revision,
          values,
          actorId: input.actorId,
          at: input.at,
        };
        if (
          !(await store.updateRecordIf(
            WORKFLOW_PARAMETERS,
            id,
            {
              stateField: 'status',
              state: 'current',
              versionField: 'revision',
              version: input.expectedRevision,
            },
            {
              revision,
              values,
              actorId: input.actorId,
              at: input.at,
              requestId: input.requestId,
              fingerprint,
            },
          ))
        )
          throw conflict();
        return version;
      },
      transaction === undefined ? undefined : { within: transaction },
    );
    return groupKey
      ? {
          ...result,
          group: input.group.key,
          schemaVersion: input.group.schemaVersion,
          values: Object.fromEntries(
            Object.keys(input.group.fields).map((key) => [
              key,
              result.values[key],
            ]),
          ),
        }
      : result;
  }
}
