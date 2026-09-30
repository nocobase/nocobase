import { createMemoryRouter } from 'react-router';
import SkillsSettingsPage from '../client/pages/skills-settings-page.js';
import SkillDetailPage from '../client/pages/skills/detail.js';
import SkillInstructionsPage from '../client/pages/skills/instructions.js';
import SkillToolsPage from '../client/pages/skills/tools.js';
import ToolsSettingsPage from '../client/pages/tools-settings-page.js';
import ToolDetailPage from '../client/pages/tools/detail.js';

export function createCatalogTestRouter(
  catalog: 'skills' | 'tools',
  initialEntries: string[] = [`/settings/ai/${catalog}`],
): ReturnType<typeof createMemoryRouter> {
  return createMemoryRouter(
    [
      {
        path: '/settings/ai/skills',
        Component: SkillsSettingsPage,
        children: [
          {
            path: ':skillName',
            Component: SkillDetailPage,
            children: [
              { path: 'instructions', Component: SkillInstructionsPage },
              { path: 'tools', Component: SkillToolsPage },
            ],
          },
        ],
      },
      {
        path: '/settings/ai/tools',
        Component: ToolsSettingsPage,
        children: [{ path: ':toolName', Component: ToolDetailPage }],
      },
      { path: '/outside', element: <p>Outside catalog</p> },
    ],
    { initialEntries },
  );
}
