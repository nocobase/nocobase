/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { App, Button, Form, Input } from 'antd';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const flowMocks = {
  ctx: {
    api: {
      resource: vi.fn(),
    },
  },
  engine: {
    context: {
      t: vi.fn((key: string) => key),
    },
  },
  view: {
    close: vi.fn(),
  },
};

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    DrawerFormLayout: ({
      children,
      footer,
      title,
    }: {
      children: React.ReactNode;
      footer: React.ReactNode;
      title: string;
    }) => (
      <section aria-label={title}>
        {children}
        {footer}
      </section>
    ),
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    randomId: () => 'd_generated',
    useFlowContext: () => flowMocks.ctx,
    useFlowEngine: () => flowMocks.engine,
    useFlowView: () => flowMocks.view,
  };
});

import { DataSourceForm } from '../DataSourceForm';

function SettingsForm(props: { loadCollections: (key: string) => Promise<unknown> }) {
  return (
    <>
      <Form.Item name={['options', 'port']} label="Port">
        <Input />
      </Form.Item>
      <Form.Item name={['options', 'ssl', 'sslMode']} label="SSL mode">
        <Input />
      </Form.Item>
      <Form.Item name="collections" hidden>
        <Input />
      </Form.Item>
      <Button onClick={() => props.loadCollections('external')}>Load collections</Button>
    </>
  );
}

function renderForm(options?: { mode?: 'create' | 'edit'; onSubmitted?: (record?: Record<string, unknown>) => void }) {
  const resource = {
    create: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            key: 'created_source',
          },
        },
      }),
    ),
    readTables: vi.fn(() =>
      Promise.resolve({
        data: ['orders', 'users'],
      }),
    ),
    testConnection: vi.fn(() => Promise.resolve({ data: { data: {} } })),
    update: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            key: 'external',
          },
        },
      }),
    ),
  };
  flowMocks.ctx.api.resource.mockReturnValue(resource);
  const onSubmitted = vi.fn(options?.onSubmitted || (() => undefined));

  render(
    <App>
      <DataSourceForm
        mode={options?.mode || 'edit'}
        type={{
          name: 'postgres',
          label: 'PostgreSQL',
          defaultValues: {
            displayName: 'New source',
            options: {
              port: '5432',
            },
            collections: ['orders'],
          },
          SettingsForm,
          normalizeValues: (values) => ({
            ...values,
            normalized: true,
          }),
        }}
        initialValues={{
          key: 'external',
          displayName: 'External source',
          options: {
            port: ' 5432 ',
            ssl: {
              sslMode: 'disable',
              rejectUnauthorized: true,
            },
          },
          collections: [{ name: 'orders', selected: true }, { name: 'users', selected: false }, 'legacy'],
        }}
        onSubmitted={onSubmitted}
      />
    </App>,
  );

  return {
    onSubmitted,
    resource,
  };
}

describe('DataSourceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads collections and tests connections with normalized values', async () => {
    const { resource } = renderForm();

    fireEvent.click(screen.getByText('Load collections'));
    await waitFor(() =>
      expect(resource.readTables).toHaveBeenCalledWith({
        values: {
          dataSourceKey: 'external',
        },
      }),
    );

    fireEvent.click(screen.getByText('Test Connection'));

    await waitFor(() =>
      expect(resource.testConnection).toHaveBeenCalledWith({
        values: expect.objectContaining({
          collections: ['orders', 'legacy'],
          normalized: true,
          options: {
            port: 5432,
            ssl: {
              sslMode: 'disable',
            },
          },
        }),
      }),
    );
  });

  it('updates existing data sources and closes the drawer after submit', async () => {
    const { onSubmitted, resource } = renderForm();

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() =>
      expect(resource.update).toHaveBeenCalledWith({
        filterByTk: 'external',
        values: expect.objectContaining({
          collections: ['orders', 'legacy'],
          normalized: true,
          options: {
            port: 5432,
            ssl: {
              sslMode: 'disable',
            },
          },
        }),
      }),
    );
    expect(onSubmitted).toHaveBeenCalledWith({
      key: 'external',
    });
    expect(flowMocks.view.close).toHaveBeenCalled();
  });

  it('creates data sources with default values', async () => {
    const { resource } = renderForm({ mode: 'create' });

    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() =>
      expect(resource.create).toHaveBeenCalledWith({
        values: expect.objectContaining({
          key: 'd_generated',
          type: 'postgres',
        }),
      }),
    );
  });
});
