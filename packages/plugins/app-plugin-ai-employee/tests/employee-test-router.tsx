import type { ReactElement } from 'react';
import {
  BrowserRouter,
  createMemoryRouter,
  useRoutes,
  type RouteObject,
} from 'react-router';
import AISettingsPage from '../client/pages/settings-page.js';
import EmployeeProfilePage from '../client/pages/employees/profile.js';
import EmployeeRolePage from '../client/pages/employees/role.js';
import EmployeeModelsPage from '../client/pages/employees/models.js';
import EmployeeSkillsPage from '../client/pages/employees/skills.js';
import EmployeeToolsPage from '../client/pages/employees/tools.js';
import EmployeeKnowledgePage from '../client/pages/employees/knowledge.js';
import EmployeeNotFoundPage from '../client/pages/employees/not-found.js';

const employeeTestRoutes: RouteObject[] = [
  {
    path: '/settings/ai',
    Component: AISettingsPage,
    children: [
      {
        path: 'employees/:username/profile',
        Component: EmployeeProfilePage,
      },
      { path: 'employees/:username/role', Component: EmployeeRolePage },
      { path: 'employees/:username/models', Component: EmployeeModelsPage },
      { path: 'employees/:username/skills', Component: EmployeeSkillsPage },
      { path: 'employees/:username/tools', Component: EmployeeToolsPage },
      {
        path: 'employees/:username/knowledge',
        Component: EmployeeKnowledgePage,
      },
      { path: 'employees/:username/:tab', Component: EmployeeNotFoundPage },
    ],
  },
  { path: '/outside', element: <h1>Outside employee settings</h1> },
];

export function createEmployeeTestRouter(
  initialEntries: string[] = ['/settings/ai'],
): ReturnType<typeof createMemoryRouter> {
  return createMemoryRouter(employeeTestRoutes, { initialEntries });
}

function EmployeeRoutes(): ReactElement | null {
  return useRoutes(employeeTestRoutes);
}

/** The same routes under the BrowserRouter the host renders, driven by the jsdom window history. */
export function EmployeeBrowserRoutes(): ReactElement {
  return (
    <BrowserRouter>
      <EmployeeRoutes />
    </BrowserRouter>
  );
}
