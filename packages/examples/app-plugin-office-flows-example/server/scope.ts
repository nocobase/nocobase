/** The plugin's package name: its jobs scope and its log name. */
export const OFFICE_FLOWS_SCOPE: string =
  '@nocobase/app-plugin-office-flows-example';

/** The collections this plugin's migration creates. */
export const COLLECTIONS: {
  readonly dataRequests: 'officeFlowsDataRequests';
  readonly extractions: 'officeFlowsExtractions';
  readonly incoming: 'officeFlowsIncoming';
  readonly assignments: 'officeFlowsAssignments';
  readonly managementCc: 'officeFlowsManagementCc';
  readonly clerkTasks: 'officeFlowsClerkTasks';
  readonly teamTasks: 'officeFlowsTeamTasks';
  readonly executorTasks: 'officeFlowsExecutorTasks';
  readonly taskAssignees: 'officeFlowsTaskAssignees';
  readonly departments: 'officeFlowsDepartments';
  readonly managementGroups: 'officeFlowsManagementGroups';
  readonly holidays: 'officeFlowsHolidays';
  readonly serials: 'officeFlowsSerials';
  readonly notices: 'officeFlowsNotices';
  readonly traces: 'officeFlowsTraces';
  readonly transitions: 'officeFlowsTransitions';
  readonly effectRuns: 'officeFlowsEffectRuns';
} = Object.freeze({
  dataRequests: 'officeFlowsDataRequests',
  extractions: 'officeFlowsExtractions',
  incoming: 'officeFlowsIncoming',
  assignments: 'officeFlowsAssignments',
  managementCc: 'officeFlowsManagementCc',
  clerkTasks: 'officeFlowsClerkTasks',
  teamTasks: 'officeFlowsTeamTasks',
  executorTasks: 'officeFlowsExecutorTasks',
  taskAssignees: 'officeFlowsTaskAssignees',
  departments: 'officeFlowsDepartments',
  managementGroups: 'officeFlowsManagementGroups',
  holidays: 'officeFlowsHolidays',
  serials: 'officeFlowsSerials',
  notices: 'officeFlowsNotices',
  traces: 'officeFlowsTraces',
  transitions: 'officeFlowsTransitions',
  effectRuns: 'officeFlowsEffectRuns',
});
