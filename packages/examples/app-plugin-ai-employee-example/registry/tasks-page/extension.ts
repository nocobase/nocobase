import {
  defineClientRouteComponentOverrides,
  defineClientSourceExtension,
  type AppClientSourceExtension,
} from '@nocobase/app-client/plugins';
import { AI_EMPLOYEE_EXAMPLE_ROUTE_IDS } from '@nocobase/app-plugin-ai-employee-example/client';

// Replaces only the component of the plugin's route; its path, menu entry and access rule stay with the plugin.
const aiEmployeeExampleTasksPageExtension: AppClientSourceExtension =
  defineClientSourceExtension({
    name: 'nocobase-ai-employee-example-tasks-page',
    routeComponentOverrides: defineClientRouteComponentOverrides([
      {
        routeId: AI_EMPLOYEE_EXAMPLE_ROUTE_IDS.tasks,
        componentEntry:
          './client/extensions/nocobase-ai-employee-example-tasks-page/pages/ai-employee-tasks-page',
        componentLoader: () => import('./pages/ai-employee-tasks-page'),
      },
    ]),
  });

export default aiEmployeeExampleTasksPageExtension;
