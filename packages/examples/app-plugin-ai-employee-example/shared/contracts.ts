// Names shared by the server registration, the plugin's route, and the application-owned Registry page. The
// Registry page imports them through the `./contracts` export, so renaming one here reaches every side.

export interface AIEmployeeExampleRouteIds {
  readonly tasks: string;
}

/** The stable Route ID the Registry page overrides. */
export const AI_EMPLOYEE_EXAMPLE_ROUTE_IDS: AIEmployeeExampleRouteIds =
  Object.freeze({
    tasks: '@nocobase/app-plugin-ai-employee-example:aiEmployeeExampleTasks',
  });

/** The AI employee the plugin registers. */
export const AI_EMPLOYEE_EXAMPLE_EMPLOYEE: string = 'iris';

/** The backend tool the plugin registers for that employee. */
export const AI_EMPLOYEE_EXAMPLE_TICKET_HISTORY_TOOL: string =
  'example-ticket-history';
