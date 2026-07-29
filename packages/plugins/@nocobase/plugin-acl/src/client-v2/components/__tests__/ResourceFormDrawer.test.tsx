/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form, Input } from 'antd';
import { ResourceFormDrawer } from '../ResourceFormDrawer';

vi.mock('@nocobase/client-v2', async () => {
  const ReactModule = await import('react');

  return {
    DrawerFormLayout: ({
      title,
      children,
      onSubmit,
      submitting,
      submitText,
      cancelText,
      footer,
    }: {
      title?: React.ReactNode;
      children?: React.ReactNode;
      onSubmit?: () => Promise<void> | void;
      submitting?: boolean;
      submitText?: React.ReactNode;
      cancelText?: React.ReactNode;
      footer?: React.ReactNode;
    }) =>
      ReactModule.createElement(
        'div',
        { role: 'dialog', 'aria-label': String(title) },
        ReactModule.createElement('div', { 'data-testid': 'submitting' }, String(!!submitting)),
        children,
        footer,
        ReactModule.createElement(
          'button',
          {
            type: 'button',
            onClick: async () => {
              try {
                await onSubmit?.();
              } catch {
                // DrawerFormLayout keeps validation errors in the form; the test asserts the visible invalid state.
              }
            },
          },
          submitText ?? 'Submit',
        ),
        ReactModule.createElement('button', { type: 'button' }, cancelText ?? 'Cancel'),
      ),
  };
});

describe('ResourceFormDrawer', () => {
  it('validates and submits form values through the drawer layout', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onSubmitted = vi.fn().mockResolvedValue(undefined);

    render(
      <ResourceFormDrawer
        title="Edit role"
        initialValues={{ name: 'admin' }}
        onSubmit={onSubmit}
        onSubmitted={onSubmitted}
        submitText="Save"
        cancelText="Close"
      >
        <Form.Item name="name" label="Role UID" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </ResourceFormDrawer>,
    );

    expect(screen.getByRole('dialog', { name: 'Edit role' })).toBeInTheDocument();
    expect(screen.getByLabelText('Role UID')).toHaveValue('admin');

    fireEvent.change(screen.getByLabelText('Role UID'), { target: { value: 'manager' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: 'manager' }, expect.any(Object));
    });
    expect(onSubmitted).toHaveBeenCalledWith({ name: 'manager' });
  });

  it('does not submit when validation fails', async () => {
    const onSubmit = vi.fn();

    render(
      <ResourceFormDrawer title="New role" onSubmit={onSubmit} submitText="Create">
        <Form.Item name="title" label="Role display name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
      </ResourceFormDrawer>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Role display name')).toHaveAttribute('aria-invalid', 'true');
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('resets form values when initial values change', async () => {
    function Host() {
      const [initialValues, setInitialValues] = React.useState({ name: 'admin' });

      return (
        <>
          <button type="button" onClick={() => setInitialValues({ name: 'member' })}>
            Switch role
          </button>
          <ResourceFormDrawer title="Edit role" initialValues={initialValues} onSubmit={vi.fn()}>
            <Form.Item name="name" label="Role UID">
              <Input />
            </Form.Item>
          </ResourceFormDrawer>
        </>
      );
    }

    render(<Host />);

    expect(screen.getByLabelText('Role UID')).toHaveValue('admin');
    fireEvent.change(screen.getByLabelText('Role UID'), { target: { value: 'changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Switch role' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Role UID')).toHaveValue('member');
    });
  });
});
