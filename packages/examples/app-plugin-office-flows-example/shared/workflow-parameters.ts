export interface DispatchRules {
  departmentNames: string[];
  ownDepartmentOnly: boolean;
  assigneeRole: 'clerks' | 'heads' | 'leaders';
  ccHeads: boolean;
  ccLeaders: boolean;
}
export function defaultDispatchRules(workflow: string): DispatchRules {
  return {
    departmentNames: [],
    ownDepartmentOnly: workflow === 'teamTasks',
    assigneeRole: 'clerks',
    ccHeads: false,
    ccLeaders: false,
  };
}
export interface OfficeWorkflowValues {
  dispatchRules?: DispatchRules;
  departments?: {
    name: string;
    clerks: string[];
    heads: string[];
    leaders: string[];
  }[];
  managementGroups?: { id: number; name: string; members: string[] }[];
  holidays?: { date: string; kind: 'holiday' | 'workday'; name: string }[];
}
export interface OfficeWorkflowParameters {
  workflow: string;
  revision: number;
  values: OfficeWorkflowValues;
  organization?: {
    revision: number;
    departments: NonNullable<OfficeWorkflowValues['departments']>;
    legacyOverrides: boolean;
  };
}
export const officeParameterFields: Readonly<
  Record<string, readonly (keyof OfficeWorkflowValues)[]>
> = {
  incoming: ['dispatchRules', 'managementGroups'],
  clerkTasks: ['dispatchRules'],
  teamTasks: ['dispatchRules'],
  dataRequests: ['holidays'],
};
