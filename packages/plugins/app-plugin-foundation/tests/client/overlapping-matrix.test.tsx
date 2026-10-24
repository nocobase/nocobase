import { renderWithApp } from '@nocobase/app-testing/client';
import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import plugin from '../../client/plugin.js';
import { ModuleMatrix } from '../../client/components/module-matrix.js';
import type { FoundationCapability } from '../../shared/foundation.js';
import {
  overlapCases,
  withOverlapFixture,
} from '../helpers/overlapping-routes.js';

it.each(
  overlapCases.filter((scenario) =>
    [
      'fixed first',
      'parameter first',
      'explicit next',
      'conditional next',
      'independent API evidence',
    ].includes(scenario.name),
  ),
)('$name renders the analyzed matrix checkmarks', async (scenario) => {
  await withOverlapFixture(scenario, async ({ modules }) => {
    const capabilities: FoundationCapability[] = [
      'interface',
      'usersAndOrganizations',
      'permissions',
      'files',
      'mail',
      'dataModeling',
    ].map((key) => ({
      key,
      status: 'active',
      facts: [],
      metrics: [],
      parts: [],
      packages: [],
      completeness: 'complete',
      issues: [],
    }));
    await renderWithApp(
      <ModuleMatrix
        modules={modules}
        capabilities={capabilities}
        onSelect={() => {}}
        onFocusModule={() => {}}
      />,
      { plugins: [plugin()] },
    );
    const table = within(screen.getByRole('table'));
    expect(
      table.getByRole('button', { name: 'Inspect Page × File management' }),
    ).toBeTruthy();
    const db = table.queryByRole('button', {
      name: 'Inspect Page × Data modeling',
    });
    const mail = table.queryByRole('button', { name: 'Inspect Page × Mail' });
    expect(Boolean(db)).toBe(scenario.providers.some((key) => key === 'db'));
    expect(Boolean(mail)).toBe(
      scenario.providers.some((key) => key === 'mail'),
    );
    if (!scenario.complete)
      expect(screen.getByText(/Some page dependencies/)).toBeTruthy();
  });
});
