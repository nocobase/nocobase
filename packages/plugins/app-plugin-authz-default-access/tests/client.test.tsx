// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthorizationOptions } from '@nocobase/app-plugin-authorization/client/management';
import type { I18nRuntime } from '@nocobase/i18n';
import { useLocation } from 'react-router';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveAppClientContributions,
  defineSettingsRoutes,
} from '@nocobase/app-client/plugins';
import routes from '../client/routes.js';
import { DefaultAccessPanel } from '../client/pages/default-access-panel.js';
import {
  englishRuntime,
  renderPanel,
  subsection,
  translate,
  withSubsections,
} from './helpers.js';

const client = vi.hoisted(() => ({
  listDefaultAccess: vi.fn(),
  listDefaultAccessRecords: vi.fn(),
  createDefaultAccess: vi.fn(),
  updateDefaultAccess: vi.fn(),
  deleteDefaultAccess: vi.fn(),
}));
vi.mock('../client/api.js', () => ({ useDefaultAccessClient: () => client }));
it('contributes its page to the authorization group with its own namespace, gated by its settings item', () => {
  const result = resolveAppClientContributions([
    { packageName: '@nocobase/app-plugin-authz-default-access', routes },
    {
      packageName: '@nocobase/app-plugin-authorization',
      routes: defineSettingsRoutes([
        {
          name: 'authorization',
          path: '/authorization',
          navigation: { title: 'Authorization' },
          children: [],
        },
      ]),
    },
  ]);
  expect(result.settings[0]).toMatchObject({
    id: 'default-access',
    path: '/settings/authorization/default-access',
    packageName: '@nocobase/app-plugin-authz-default-access',
    groupId: 'authorization',
    authz: {
      resource: { type: 'settings', id: 'authorization.default-access' },
      action: 'read',
    },
  });
});

describe('the default access panel', () => {
  const resource = { type: 'database.collection', id: 'orders' };
  const read = { value: 'read', label: 'Read' };
  const tables = subsection('administration.tables', 'Tables', [
    { type: resource.type, value: 'orders', label: 'Orders', actions: [read] },
  ]);
  const options: AuthorizationOptions = {
    sections: withSubsections({ administration: [tables] }),
    subjectTypes: [],
    collections: [{ name: 'orders', fields: ['id', 'name'] }],
    recordAccess: [],
  };
  let runtime: I18nRuntime;
  const allRecords = () => translate(runtime, 'labels.allRecords', true);

  function Location() {
    return <output data-testid='location'>{useLocation().search}</output>;
  }

  beforeAll(async () => {
    runtime = await englishRuntime();
  });

  beforeEach(() => {
    vi.resetAllMocks();
    client.listDefaultAccess.mockResolvedValue([]);
    client.listDefaultAccessRecords.mockResolvedValue([]);
    client.createDefaultAccess.mockResolvedValue(undefined);
    client.updateDefaultAccess.mockResolvedValue(undefined);
    client.deleteDefaultAccess.mockResolvedValue(undefined);
  });

  it('saves simple scopes inline without opening a dialog', async () => {
    renderPanel(runtime, <DefaultAccessPanel options={options} />);
    const cell = screen.getByRole('button', { name: 'Orders: Read' });
    await waitFor(() => expect(cell).toBeEnabled());
    expect(screen.queryByRole('button', { name: 'Orders: Update' })).toBeNull();
    // A user's press, not a bare click event: it lets React finish wiring a trigger that has just appeared.
    await userEvent.click(cell);
    fireEvent.click(
      await screen.findByRole('menuitem', { name: allRecords() }),
    );
    await waitFor(() =>
      expect(client.createDefaultAccess).toHaveBeenCalledWith({
        key: 'database.collection.orders',
        resource,
        actions: [{ action: 'read', selection: { type: 'all' } }],
      }),
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('preserves other actions and retains the old scope when an inline save fails', async () => {
    const actions = [
      { action: 'read', selection: { type: 'all' } },
      { action: 'update', selection: { type: 'records', ids: ['1'] } },
    ];
    client.listDefaultAccess.mockResolvedValue([
      { key: 'orders-default', resource, actions },
    ]);
    client.updateDefaultAccess.mockRejectedValue(new Error('Save failed'));
    renderPanel(runtime, <DefaultAccessPanel options={options} />);
    const cell = screen.getByRole('button', { name: 'Orders: Read' });
    await waitFor(() => expect(cell).toHaveAttribute('title', allRecords()));
    await userEvent.click(cell);
    fireEvent.click(
      await screen.findByRole('menuitem', {
        name: translate(runtime, 'defaultAccess.noDefault'),
      }),
    );
    await waitFor(() =>
      expect(client.updateDefaultAccess).toHaveBeenCalledWith(
        'orders-default',
        { key: 'orders-default', resource, actions: [actions[1]] },
      ),
    );
    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(cell).toHaveAttribute('title', allRecords());
  });

  it('switches subsections without mixing their resources or actions', () => {
    const multi: AuthorizationOptions = {
      ...options,
      sections: withSubsections({
        administration: [
          tables,
          subsection('administration.libraries', 'Libraries', [
            {
              type: 'library',
              value: 'docs',
              label: 'Documents',
              actions: [{ value: 'browse', label: 'Browse' }],
            },
          ]),
        ],
      }),
    };
    renderPanel(
      runtime,
      <>
        <DefaultAccessPanel options={multi} />
        <Location />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Libraries1' }));
    expect(screen.queryByRole('button', { name: 'Orders' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Documents: Browse' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Read' })).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '?section=administration.libraries',
    );
  });
});
