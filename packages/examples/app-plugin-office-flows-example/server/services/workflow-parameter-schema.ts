import { z } from 'zod';
import { isPerson } from '../../shared/people.js';
import type {
  DispatchRules,
  OfficeWorkflowValues as Values,
} from '../../shared/workflow-parameters.js';

const people = z
  .array(z.string().refine(isPerson, 'Unknown example person.'))
  .max(100);
const DepartmentParameter = z.strictObject({
  name: z.string().trim().min(1).max(100),
  clerks: people.min(1),
  heads: people,
  leaders: people,
});
const ManagementParameter = z.strictObject({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  members: people.min(1),
});
const HolidayParameter = z.strictObject({
  date: z.iso.date(),
  kind: z.enum(['holiday', 'workday']),
  name: z.string().max(100),
});
export const OfficeDispatchRules: z.ZodType<DispatchRules> = z.strictObject({
  departmentNames: z.array(z.string().trim().min(1).max(100)).max(100),
  ownDepartmentOnly: z.boolean(),
  assigneeRole: z.enum(['clerks', 'heads', 'leaders']),
  ccHeads: z.boolean(),
  ccLeaders: z.boolean(),
});
export const OfficeWorkflowValues: z.ZodType<Values> = z
  .strictObject({
    dispatchRules: OfficeDispatchRules.optional(),
    departments: z.array(DepartmentParameter).max(100).optional(),
    managementGroups: z.array(ManagementParameter).max(100).optional(),
    holidays: z.array(HolidayParameter).max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    for (const [key, ids] of [
      ['departments', value.departments?.map((row) => row.name)],
      ['dispatchRules', value.dispatchRules?.departmentNames],
      ['managementGroups', value.managementGroups?.map((row) => row.id)],
      ['holidays', value.holidays?.map((row) => row.date)],
    ] as const) {
      if (ids && new Set<string | number>(ids).size !== ids.length)
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: 'Entries must have unique identifiers.',
        });
    }
  });
