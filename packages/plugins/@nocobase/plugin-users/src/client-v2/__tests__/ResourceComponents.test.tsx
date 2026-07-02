/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Input, Form } from 'antd';
import React from 'react';
import { ResourceFormDrawer, ResourcePickerView, ResourceTablePage, SettingsActionCell } from '../components/resource';

const { latestTableProps, close } = vi.hoisted(() => ({
  latestTableProps: {
    current: null as null | Record<string, unknown>,
  },
  close: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async () => {
  const React = await import('react');

  return {
    DEFAULT_PAGE_SIZE: 20,
    CollectionFilter: ({ onChange }: { onChange: (filter: Record<string, unknown>) => void }) =>
      React.createElement(
        'button',
        {
          onClick: () => onChange({ username: { $includes: 'alice' } }),
        },
        'Filter',
      ),
    DrawerFormLayout: ({
      children,
      onSubmit,
      submitting,
    }: {
      children?: React.ReactNode;
      onSubmit?: () => Promise<void>;
      submitting?: boolean;
    }) =>
      React.createElement(
        'div',
        null,
        children,
        React.createElement(
          'button',
          {
            disabled: submitting,
            onClick: async () => {
              await onSubmit?.();
            },
          },
          'Submit drawer',
        ),
      ),
    Table: (props: Record<string, unknown>) => {
      latestTableProps.current = props;
      const dataSource = Array.isArray(props.dataSource) ? props.dataSource : [];
      return React.createElement(
        'div',
        { 'data-testid': 'resource-table' },
        dataSource.map((record: Record<string, unknown>) =>
          React.createElement('div', { key: String(record.id) }, String(record.username ?? record.name ?? record.id)),
        ),
      );
    },
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const React = await import('react');

  return {
    useFlowView: () => ({
      close,
      Header: ({ title }: { title: React.ReactNode }) => React.createElement('div', null, title),
      Footer: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
    }),
  };
});

describe('plugin-users client-v2 resource components', () => {
  beforeEach(() => {
    latestTableProps.current = null;
    close.mockReset();
  });

  it('submits ResourceFormDrawer values after validation', async () => {
    const onSubmit = vi.fn();
    const onSubmitted = vi.fn();

    render(
      <ResourceFormDrawer
        title="Edit"
        initialValues={{ username: 'alice' }}
        onSubmit={onSubmit}
        onSubmitted={onSubmitted}
      >
        <Form.Item name="username">
          <Input aria-label="Username" />
        </Form.Item>
      </ResourceFormDrawer>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toHaveValue('alice');
    });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bob' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit drawer' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ username: 'bob' }, expect.anything());
    });
    expect(onSubmitted).toHaveBeenCalledWith({ username: 'bob' });
  });

  it('loads ResourceTablePage data and refreshes when filter changes', async () => {
    const request = vi.fn().mockResolvedValue({
      data: [{ id: 1, username: 'alice' }],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    render(
      <ResourceTablePage
        collection={{} as never}
        rowKey="id"
        columns={[]}
        request={request}
        toolbar={({ refresh }) => <button onClick={refresh}>Refresh table</button>}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
    expect(request).toHaveBeenLastCalledWith({ filter: undefined, page: 1, pageSize: 20 });

    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));

    await waitFor(() => {
      expect(request).toHaveBeenLastCalledWith({
        filter: { username: { $includes: 'alice' } },
        page: 1,
        pageSize: 20,
      });
    });
  });

  it('renders visible SettingsActionCell actions and invokes handlers with the record', () => {
    const edit = vi.fn();
    const hidden = vi.fn();

    render(
      <SettingsActionCell
        record={{ id: 1 }}
        actions={[
          {
            key: 'edit',
            label: 'Edit',
            onClick: edit,
          },
          {
            key: 'hidden',
            label: 'Hidden',
            hidden: true,
            onClick: hidden,
          },
        ]}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Hidden' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(edit).toHaveBeenCalledWith({ id: 1 });
    expect(hidden).not.toHaveBeenCalled();
  });

  it('submits ResourcePickerView selection and closes with selected rows', async () => {
    const onSubmit = vi.fn();
    const request = vi.fn().mockResolvedValue({
      data: [{ id: 7, username: 'alice' }],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    render(
      <ResourcePickerView
        title="Pick users"
        rowKey="id"
        columns={[]}
        request={request}
        onSubmit={onSubmit}
        t={(key) => key}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    const rowSelection = latestTableProps.current?.rowSelection as {
      onChange: (keys: React.Key[], rows: Array<Record<string, unknown>>) => void;
    };
    act(() => {
      rowSelection.onChange([7], [{ id: 7, username: 'alice' }]);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Submit' })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith([{ id: 7, username: 'alice' }], [7]);
    });
    expect(close).toHaveBeenCalledWith({
      selectedRows: [{ id: 7, username: 'alice' }],
      selectedRowKeys: [7],
    });
  });
});
