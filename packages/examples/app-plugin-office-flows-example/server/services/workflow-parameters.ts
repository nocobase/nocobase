import { OfficeWorkflowValues as OfficeWorkflowValuesSchema } from './workflow-parameter-schema.js';
import { text } from '../../shared/text.js';
import type { DatabaseManager, DatabaseConnection } from '@nocobase/db';
import { ApiError } from '@nocobase/app-server/router';
import {
  officeParameterFields,
  defaultDispatchRules,
  type OfficeWorkflowParameters,
  type OfficeWorkflowValues,
} from '../../shared/workflow-parameters.js';

export class OfficeWorkflowParameterService {
  public constructor(
    private readonly database: DatabaseManager,
    private readonly connection: DatabaseConnection | undefined = undefined,
  ) {}
  private repository(name: string) {
    return (this.connection ?? this.database).repository(name);
  }
  public async read(workflow: string): Promise<OfficeWorkflowParameters> {
    const fields = officeParameterFields[workflow];
    if (!fields)
      throw new ApiError({
        status: 'NOT_FOUND',
        domain: 'office-flows-example',
        reason: 'WORKFLOW_PARAMETERS_NOT_FOUND',
        message: 'This workflow has no configurable parameters.',
      });
    const saved = await this.repository(
      'officeFlowsWorkflowParameters',
    ).findOne({ filter: { id: `office.${workflow}` } });
    const stored = saved ? OfficeWorkflowValuesSchema.parse(saved.values) : {};
    const values: OfficeWorkflowValues = {};
    for (const field of fields) {
      if (field === 'dispatchRules') {
        values.dispatchRules = stored.dispatchRules ?? {
          ...defaultDispatchRules(workflow),
          departmentNames: stored.departments?.map((row) => row.name) ?? [],
        };
        continue;
      }
      if (stored[field]) {
        Object.assign(values, { [field]: stored[field] });
        continue;
      }
      const rows = await this.repository(
        {
          departments: 'officeFlowsDepartments',
          managementGroups: 'officeFlowsManagementGroups',
          holidays: 'officeFlowsHolidays',
        }[field],
      ).findMany({});
      if (field === 'managementGroups')
        values.managementGroups = rows.map((row) => ({
          id: Number(row.id),
          name: text(row.name),
          members: row.members as string[],
        }));
      if (field === 'holidays')
        values.holidays = rows.map((row) => ({
          date: text(row.date),
          kind: row.kind as 'holiday' | 'workday',
          name: text(row.name),
        }));
    }
    return {
      workflow,
      revision: Number(saved?.revision ?? 0),
      ...(fields.includes('dispatchRules')
        ? { organization: await this.organization() }
        : {}),
      values: OfficeWorkflowValuesSchema.parse(values),
    };
  }
  public async organization(): Promise<
    NonNullable<OfficeWorkflowParameters['organization']>
  > {
    const saved = await this.repository(
      'officeFlowsWorkflowParameters',
    ).findOne({ filter: { id: 'office.organization' } });
    if (saved)
      return {
        revision: Number(saved.revision),
        departments:
          OfficeWorkflowValuesSchema.parse(saved.values).departments ?? [],
        legacyOverrides: false,
      };
    // Until shared settings are saved, retain uniquely named legacy departments.
    // Incoming wins name collisions, followed by clerk and team overrides.
    const departments = new Map<
      string,
      NonNullable<OfficeWorkflowValues['departments']>[number]
    >();
    let legacyOverrides = false;
    for (const workflow of ['incoming', 'clerkTasks', 'teamTasks']) {
      const row = await this.repository(
        'officeFlowsWorkflowParameters',
      ).findOne({ filter: { id: `office.${workflow}` } });
      const legacy = row
        ? OfficeWorkflowValuesSchema.parse(row.values).departments
        : undefined;
      if (legacy) legacyOverrides = true;
      for (const department of legacy ?? [])
        if (!departments.has(department.name))
          departments.set(department.name, department);
    }
    const seeded = await this.repository('officeFlowsDepartments').findMany({});
    for (const row of seeded)
      if (!departments.has(text(row.name)))
        departments.set(text(row.name), {
          name: text(row.name),
          clerks: row.clerks as string[],
          heads: row.heads as string[],
          leaders: row.leaders as string[],
        });
    return {
      revision: 0,
      departments: [...departments.values()],
      legacyOverrides,
    };
  }
  public async save(
    workflow: string,
    input: unknown,
    expectedRevision: number,
    organization?: {
      expectedRevision: number;
      departments: NonNullable<OfficeWorkflowValues['departments']>;
    },
  ): Promise<OfficeWorkflowParameters> {
    const values = OfficeWorkflowValuesSchema.parse(input);
    // Freeze the legacy organization before replacing a workflow's old department values.
    if (
      !organization &&
      officeParameterFields[workflow]?.includes('dispatchRules')
    ) {
      const current = await this.organization();
      organization = {
        expectedRevision: current.revision,
        departments: current.departments,
      };
    }
    const shared = organization
      ? OfficeWorkflowValuesSchema.parse({
          departments: organization.departments,
        })
      : undefined;
    const fields = officeParameterFields[workflow];
    if (
      !fields ||
      Object.keys(values).length !== fields.length ||
      fields.some((field) => values[field] === undefined) ||
      (shared !== undefined && !fields?.includes('dispatchRules'))
    )
      throw new ApiError({
        status: 'INVALID_ARGUMENT',
        domain: 'office-flows-example',
        reason: 'INVALID_WORKFLOW_PARAMETERS',
        message: 'Supply only the parameter groups declared by this workflow.',
      });
    const conflict = () =>
      new ApiError({
        status: 'ABORTED',
        domain: 'office-flows-example',
        reason: 'CONFIGURATION_CONFLICT',
        message: 'The configuration changed. Reload it before saving again.',
      });
    try {
      await this.database.transaction(async (connection) => {
        const repository = connection.repository(
          'officeFlowsWorkflowParameters',
        );
        const available =
          shared?.departments ??
          (
            await new OfficeWorkflowParameterService(
              this.database,
              connection,
            ).organization()
          ).departments;
        if (
          values.dispatchRules?.departmentNames.some(
            (name) => !available.some((row) => row.name === name),
          )
        )
          throw new ApiError({
            status: 'INVALID_ARGUMENT',
            domain: 'office-flows-example',
            reason: 'INVALID_WORKFLOW_PARAMETERS',
            message: 'Choose departments from the shared organization.',
          });
        if (shared && organization) {
          for (const other of ['incoming', 'clerkTasks', 'teamTasks']) {
            if (other === workflow) continue;
            const config = await new OfficeWorkflowParameterService(
              this.database,
              connection,
            ).read(other);
            if (
              config.values.dispatchRules?.departmentNames.some(
                (name) => !available.some((row) => row.name === name),
              )
            )
              throw new ApiError({
                status: 'INVALID_ARGUMENT',
                domain: 'office-flows-example',
                reason: 'DEPARTMENT_IN_USE',
                message:
                  'A department is still referenced by another workflow. Update its rules before renaming or removing the department.',
              });
          }
          const id = 'office.organization';
          if (organization.expectedRevision === 0) {
            if (await repository.exists({ filter: { id } })) throw conflict();
            await repository.createOne({
              values: { id, revision: 1, values: { ...shared } },
            });
          } else {
            const updated = await repository.updateMany({
              filter: { id, revision: organization.expectedRevision },
              values: {
                values: { ...shared },
                revision: organization.expectedRevision + 1,
              },
            });
            if (updated.updatedCount !== 1) throw conflict();
          }
        }
        const id = `office.${workflow}`;
        if (expectedRevision === 0) {
          if (await repository.exists({ filter: { id } })) throw conflict();
          await repository.createOne({
            values: { id, revision: 1, values: { ...values } },
          });
        } else {
          const result = await repository.updateMany({
            filter: { id, revision: expectedRevision },
            values: { values: { ...values }, revision: expectedRevision + 1 },
          });
          if (result.updatedCount !== 1) throw conflict();
        }
      });
    } catch (error) {
      // Inspect after rollback so a concurrent first insert does not poison the transaction.
      if (
        !(error instanceof ApiError) &&
        ((expectedRevision === 0 &&
          (await this.database
            .repository('officeFlowsWorkflowParameters')
            .exists({ filter: { id: `office.${workflow}` } }))) ||
          (organization?.expectedRevision === 0 &&
            (await this.database
              .repository('officeFlowsWorkflowParameters')
              .exists({ filter: { id: 'office.organization' } }))))
      )
        throw conflict();
      throw error;
    }
    return this.read(workflow);
  }
}
