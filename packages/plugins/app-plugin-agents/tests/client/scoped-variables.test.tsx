// @vitest-environment jsdom
// Several scopes' variables in one table: a Scope column, adding chooses the scope, revealing covers every scope.
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { callsTo, clientMocks, resetApi } from './fake-client.js';
import { renderRoute } from './render.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { VariablesPanel } =
  await import('../../client/components/variables/variables-panel.js');

const AT = '2026-10-01T09:00:00.000Z';
const variable = (name: string, teamRunnersOnly = false) => ({
  name,
  teamRunnersOnly,
  updatedAt: AT,
  updatedById: 'u1',
  updatedByName: 'Alice',
});
const SCOPES = [
  { scope: 'project', scopeId: 'p1', label: 'The whole project' },
  { scope: 'workdir', scopeId: 'w1', label: 'Working directory shop' },
] as const;

describe('variables of several scopes', () => {
  beforeEach(() => {
    resetApi({
      'agents/variables/project/p1': () => [variable('API_URL')],
      'agents/variables/workdir/w1': () => [
        variable('API_URL'),
        variable('SHOP_KEY', true),
      ],
      'POST agents/variables/project/p1/reveal': () => [
        { name: 'API_URL', value: 'https://project' },
      ],
      'POST agents/variables/workdir/w1/reveal': () => [
        { name: 'API_URL', value: 'https://shop' },
        { name: 'SHOP_KEY', value: 'k-1' },
      ],
      'PUT agents/variables/workdir/w1/NEW_KEY': () => null,
      'PUT agents/variables/workdir/w1/SHOP_KEY': () => null,
    });
  });

  it('lists every scope’s variables with their scope, and adds one to the chosen scope', async () => {
    renderRoute(
      <VariablesPanel
        scopes={SCOPES}
        canEdit
        title='Variables'
        description='For runs here'
        note='A working directory wins'
      />,
      '/',
      '/',
    );
    const table = await screen.findByRole('table', { name: 'Variables' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('API_URLThe whole project'),
      expect.stringContaining('API_URLWorking directory shop'),
      expect.stringContaining(
        'SHOP_KEYenvVars.teamRunnersOnlyBadgeWorking directory shop',
      ),
    ]);
    expect(screen.getByText('A working directory wins')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'envVars.add' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByLabelText('envVars.scope'));
    await userEvent.click(
      await screen.findByRole('option', { name: 'Working directory shop' }),
    );
    fireEvent.change(within(dialog).getByLabelText('envVars.name'), {
      target: { value: 'NEW_KEY' },
    });
    fireEvent.change(within(dialog).getByLabelText('envVars.value'), {
      target: { value: 'v' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(
        callsTo('PUT', 'agents/variables/workdir/w1/NEW_KEY'),
      ).toHaveLength(1),
    );
  });

  it('reveals the values of every scope, each named with its scope', async () => {
    renderRoute(
      <VariablesPanel
        scopes={SCOPES}
        canEdit
        title='Variables'
        description='For runs here'
      />,
      '/',
      '/',
    );
    await screen.findByRole('table', { name: 'Variables' });
    fireEvent.click(screen.getByRole('button', { name: 'envVars.reveal' }));
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(
      within(confirm).getByRole('button', { name: 'envVars.reveal' }),
    );
    expect(await screen.findByText('https://shop')).toBeInTheDocument();
    expect(screen.getByText('https://project')).toBeInTheDocument();
    expect(callsTo('POST', 'agents/variables/project/p1/reveal')).toHaveLength(
      1,
    );
    expect(callsTo('POST', 'agents/variables/workdir/w1/reveal')).toHaveLength(
      1,
    );
  });

  it('marks a variable for team runtimes only, and changes the mark without replacing the value', async () => {
    renderRoute(
      <VariablesPanel
        scopes={SCOPES}
        canEdit
        title='Variables'
        description='For runs here'
      />,
      '/',
      '/',
    );
    const table = await screen.findByRole('table', { name: 'Variables' });
    const shopKey = within(table)
      .getAllByRole('row')
      .find((row) => row.textContent?.includes('SHOP_KEY'))!;
    expect(
      within(shopKey).getByText('envVars.teamRunnersOnlyBadge'),
    ).toBeInTheDocument();

    await userEvent.click(
      within(shopKey).getByRole('button', {
        name: 'envVars.actions(name=SHOP_KEY)',
      }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'envVars.edit' }),
    );
    const dialog = await screen.findByRole('dialog');
    const mark = within(dialog).getByRole('checkbox', {
      name: 'envVars.teamRunnersOnly',
    });
    expect(mark).toBeChecked();
    await userEvent.click(mark);
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'actions.save' }),
    );
    await waitFor(() =>
      expect(
        callsTo('PUT', 'agents/variables/workdir/w1/SHOP_KEY').map(
          (call) => call.json,
        ),
      ).toEqual([{ teamRunnersOnly: false }]),
    );
  });
});
