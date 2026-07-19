/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMockClient } from '@nocobase/client-v2';
import type { FlowContext } from '@nocobase/flow-engine';
import React from 'react';
import PluginUsersClientV2 from '../plugin';

const { changePassword, currentContext, redirectToV2Signin, updateProfile } = vi.hoisted(() => ({
  changePassword: vi.fn(),
  currentContext: {
    value: null as FlowContext | null,
  },
  redirectToV2Signin: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  const React = await import('react');

  return {
    ...actual,
    DrawerFormLayout: ({
      children,
      onSubmit,
      submitText,
      title,
    }: {
      children?: React.ReactNode;
      onSubmit?: () => Promise<void>;
      submitText?: React.ReactNode;
      title?: React.ReactNode;
    }) =>
      React.createElement(
        'div',
        null,
        React.createElement('h1', null, title),
        children,
        React.createElement(
          'button',
          {
            onClick: async () => {
              try {
                await onSubmit?.();
              } catch {
                // DrawerFormLayout keeps the drawer mounted on submit errors; tests assert the visible error state.
              }
            },
          },
          submitText,
        ),
      ),
    PasswordInput: ({
      checkStrength: _checkStrength,
      value,
      ...props
    }: React.InputHTMLAttributes<HTMLInputElement> & { checkStrength?: boolean }) =>
      React.createElement('input', { ...props, value: value ?? '' }),
    redirectToV2Signin,
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();

  return {
    ...actual,
    useFlowEngine: () => ({
      context: {
        t: (key: string) => key,
      },
    }),
    useFlowContext: () => currentContext.value,
  };
});

function setupChangePasswordContext() {
  changePassword.mockReset();
  redirectToV2Signin.mockReset();
  currentContext.value = null;
}

function setupEditProfileContext(
  user = { nickname: 'Alice', username: 'alice', email: 'alice@example.com', phone: '1' },
) {
  updateProfile.mockReset();
  currentContext.value = null;
  return user;
}

type UserCenterDrawerModel = {
  context: FlowContext;
  onClick: () => Promise<void>;
};

type MockClientApplication = ReturnType<typeof createMockClient>;

async function renderModelContent(
  use: 'ChangePasswordItemModel' | 'EditProfileItemModel',
  configureContext?: (context: FlowContext, app: MockClientApplication) => void,
) {
  const app = createMockClient({});
  await app.pm.add(PluginUsersClientV2);
  await app.load();
  await app.flowEngine.getModelClassAsync(use);

  const model = app.flowEngine.createModel({
    use,
    uid: `${use}-test`,
  }) as unknown as UserCenterDrawerModel;
  const open = vi.fn();

  model.context.defineProperty('viewer', {
    value: {
      open,
    },
  });
  configureContext?.(model.context, app);
  currentContext.value = model.context;

  await model.onClick();
  const content = open.mock.calls[0][0].content;
  render(content());

  return { app, model };
}

describe('plugin-users client-v2 user center drawer content', () => {
  it('submits change password and redirects to signin', async () => {
    setupChangePasswordContext();
    changePassword.mockResolvedValue({});

    const { app } = await renderModelContent('ChangePasswordItemModel', (context, app) => {
      context.defineProperty('app', { value: app });
      context.defineProperty('api', {
        value: {
          resource: () => ({
            changePassword,
          }),
        },
      });
    });

    fireEvent.change(screen.getByLabelText('Old password'), { target: { value: 'old-password' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'New-password-1' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'New-password-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(changePassword).toHaveBeenCalledWith({
        values: {
          oldPassword: 'old-password',
          newPassword: 'New-password-1',
          confirmPassword: 'New-password-1',
        },
      });
    });
    expect(redirectToV2Signin).toHaveBeenCalledWith(
      app,
      expect.any(String),
      expect.objectContaining({ replace: true }),
    );
  });

  it('shows change password validation errors from registered password validators', async () => {
    setupChangePasswordContext();

    await renderModelContent('ChangePasswordItemModel', (context, app) => {
      const plugin = app.pm.get(PluginUsersClientV2) as PluginUsersClientV2;
      plugin.registerPasswordValidator('weak-password-test', async (value) =>
        value === 'weak-password' ? 'Password is too weak' : null,
      );
      context.defineProperty('app', { value: app });
      context.defineProperty('api', {
        value: {
          resource: () => ({
            changePassword,
          }),
        },
      });
    });

    fireEvent.change(screen.getByLabelText('Old password'), { target: { value: 'old-password' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'weak-password' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'weak-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Password is too weak')).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('shows change password API errors inline', async () => {
    setupChangePasswordContext();
    changePassword.mockRejectedValue({
      response: {
        data: {
          errors: [{ message: 'Old password is incorrect' }],
        },
      },
    });

    await renderModelContent('ChangePasswordItemModel', (context, app) => {
      context.defineProperty('app', { value: app });
      context.defineProperty('api', {
        value: {
          resource: () => ({
            changePassword,
          }),
        },
      });
    });

    fireEvent.change(screen.getByLabelText('Old password'), { target: { value: 'old-password' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'New-password-1' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'New-password-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Old password is incorrect')).toBeInTheDocument();
  });

  it('submits edit profile values and updates current user context', async () => {
    const user = setupEditProfileContext();
    updateProfile.mockResolvedValue({});

    await renderModelContent('EditProfileItemModel', (context) => {
      context.defineProperty('api', {
        value: {
          resource: () => ({
            updateProfile,
          }),
        },
      });
      context.defineProperty('user', { value: user });
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toHaveValue('alice');
    });

    fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bob' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bob@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        values: {
          nickname: 'Bob',
          username: 'bob',
          email: 'bob@example.com',
          phone: '2',
        },
      });
    });
    expect(user).toEqual({
      nickname: 'Bob',
      username: 'bob',
      email: 'bob@example.com',
      phone: '2',
    });
  });

  it('shows edit profile username validation errors', async () => {
    setupEditProfileContext();

    await renderModelContent('EditProfileItemModel', (context) => {
      context.defineProperty('api', {
        value: {
          resource: () => ({
            updateProfile,
          }),
        },
      });
      context.defineProperty('user', {
        value: { nickname: 'Alice', username: 'alice', email: 'alice@example.com', phone: '1' },
      });
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toHaveValue('alice');
    });

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'bad@name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Must be 1-50 characters in length (excluding @.<>"\'/)')).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('shows edit profile API errors inline', async () => {
    setupEditProfileContext();
    updateProfile.mockRejectedValue(new Error('Username already exists'));

    await renderModelContent('EditProfileItemModel', (context) => {
      context.defineProperty('api', {
        value: {
          resource: () => ({
            updateProfile,
          }),
        },
      });
      context.defineProperty('user', {
        value: { nickname: 'Alice', username: 'alice', email: 'alice@example.com', phone: '1' },
      });
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toHaveValue('alice');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Username already exists')).toBeInTheDocument();
  });
});
