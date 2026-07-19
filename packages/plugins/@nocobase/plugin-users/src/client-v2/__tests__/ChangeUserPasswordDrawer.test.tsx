/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ChangeUserPasswordDrawer from '../pages/ChangeUserPasswordDrawer';

const { formItems, setFieldsValue, update, success, onSubmitted } = vi.hoisted(() => ({
  formItems: [] as Array<Record<string, any>>,
  setFieldsValue: vi.fn(),
  update: vi.fn(),
  success: vi.fn(),
  onSubmitted: vi.fn(),
}));

vi.mock('antd', async () => {
  const React = await import('react');

  return {
    Button: ({ children, onClick }: { children?: React.ReactNode; onClick?: () => void }) =>
      React.createElement('button', { onClick }, children),
    Col: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
    Row: ({ children }: { children?: React.ReactNode }) => React.createElement('div', null, children),
    Form: {
      Item: (props: Record<string, any>) => {
        formItems.push(props);
        return React.createElement('div', null, props.children);
      },
    },
  };
});

vi.mock('@nocobase/client-v2', async () => {
  const React = await import('react');

  return {
    Plugin: class Plugin {},
    PasswordInput: (props: Record<string, unknown>) =>
      React.createElement('input', {
        'data-testid': 'password-input',
        autoComplete: props.autoComplete,
      }),
  };
});

vi.mock('@nocobase/plugin-acl/client-v2', () => ({
  default: class PluginAclClientV2 {},
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    app: {
      pm: {
        get: () => ({
          getPasswordValidators: () => [
            async (value: string, ctx: { username?: string }) =>
              value.includes(ctx.username || '') ? 'Password cannot include username' : null,
          ],
        }),
      },
    },
    api: {
      resource: () => ({
        update,
      }),
    },
    message: {
      success,
    },
  }),
}));

vi.mock('../components/resource', async () => {
  const React = await import('react');

  return {
    ResourceFormDrawer: ({
      children,
      onSubmit,
      onSubmitted: handleSubmitted,
    }: {
      children: (args: { form: { setFieldsValue: typeof setFieldsValue } }) => React.ReactNode;
      onSubmit: (values: { password: string }) => Promise<void>;
      onSubmitted: () => Promise<void>;
    }) =>
      React.createElement(
        'div',
        null,
        children({ form: { setFieldsValue } }),
        React.createElement(
          'button',
          {
            onClick: async () => {
              await onSubmit({ password: 'New-password-1' });
              await handleSubmitted();
            },
          },
          'Submit drawer',
        ),
      ),
  };
});

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

vi.mock('../shared/generatePassword', () => ({
  generatePassword: () => 'Generated-password-1',
}));

describe('ChangeUserPasswordDrawer', () => {
  beforeEach(() => {
    formItems.length = 0;
    setFieldsValue.mockReset();
    update.mockReset();
    success.mockReset();
    onSubmitted.mockReset();
  });

  it('generates a password into the form', () => {
    render(
      <ChangeUserPasswordDrawer
        user={{
          id: 1,
          username: 'alice',
        }}
        onSubmitted={onSubmitted}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Random password' }));

    expect(setFieldsValue).toHaveBeenCalledWith({ password: 'Generated-password-1' });
  });

  it('runs registered password validators with the target username', async () => {
    render(
      <ChangeUserPasswordDrawer
        user={{
          id: 1,
          username: 'alice',
        }}
        onSubmitted={onSubmitted}
      />,
    );

    const passwordItem = formItems.find((item) => item.name === 'password');
    const validator = passwordItem.rules.find((rule: Record<string, any>) => rule.validator).validator;

    await expect(validator({}, 'alice-secret')).rejects.toThrow('Password cannot include username');
    await expect(validator({}, 'secure-secret')).resolves.toBeUndefined();
  });

  it('updates user password and runs submitted side effects', async () => {
    render(
      <ChangeUserPasswordDrawer
        user={{
          id: 18,
          username: 'alice',
        }}
        onSubmitted={onSubmitted}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit drawer' }));

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({
        filterByTk: 18,
        values: {
          password: 'New-password-1',
        },
      });
    });
    expect(success).toHaveBeenCalledWith('Saved successfully');
    expect(onSubmitted).toHaveBeenCalled();
  });
});
