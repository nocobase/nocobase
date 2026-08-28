/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { Form, Input } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const holder = vi.hoisted(() => ({
  resource: {
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
  },
  ctx: {
    api: {
      resource: () => holder.resource,
    },
  },
}));

vi.mock('@nocobase/flow-engine', () => {
  return {
    randomId: () => 's_test',
    useFlowContext: () => holder.ctx,
  };
});

vi.mock('@nocobase/client-v2', () => {
  return {
    DEFAULT_PAGE_SIZE: 20,
    DrawerFormLayout: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    Table: () => null,
  };
});

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
  useAuthTranslation: () => ({ t: (key: string) => key }),
}));

import type PluginAuthClientV2 from '../plugin';
import { AuthenticatorFormView } from '../pages/AuthenticatorsPage';

function AdminSettingsBody() {
  return (
    <Form.Item name={['options', 'clientId']} label="Client ID">
      <Input />
    </Form.Item>
  );
}

describe('AuthenticatorFormView', () => {
  it('loads the complete record and shows nested option values after the type-specific form loads', async () => {
    holder.resource.get.mockResolvedValue({
      data: {
        data: {
          id: 1,
          name: 'oidc',
          authType: 'oidc',
          options: { clientId: 'saved-client-id' },
        },
      },
    });
    const plugin = {
      authTypes: {
        get: () => ({
          adminSettingsFormLoader: () => Promise.resolve({ default: AdminSettingsBody }),
        }),
      },
    } as unknown as PluginAuthClientV2;

    render(
      <AuthenticatorFormView
        mode="edit"
        authType="oidc"
        authTypeOptions={[{ name: 'oidc', title: 'OIDC' }]}
        plugin={plugin}
        record={{
          id: 1,
          name: 'oidc',
          authType: 'oidc',
        }}
        onSubmitted={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(holder.resource.get).toHaveBeenCalledWith({ filterByTk: 1 });
      expect(screen.getByLabelText('Client ID')).toHaveValue('saved-client-id');
    });
  });

  it('shows the request error and keeps the list values as a fallback', async () => {
    holder.resource.get.mockRejectedValue(new Error('Failed to load authenticator'));
    const plugin = {
      authTypes: {
        get: () => ({
          adminSettingsFormLoader: () => Promise.resolve({ default: AdminSettingsBody }),
        }),
      },
    } as unknown as PluginAuthClientV2;

    render(
      <AuthenticatorFormView
        mode="edit"
        authType="oidc"
        authTypeOptions={[{ name: 'oidc', title: 'OIDC' }]}
        plugin={plugin}
        record={{
          id: 1,
          name: 'oidc',
          authType: 'oidc',
          options: { clientId: 'fallback-client-id' },
        }}
        onSubmitted={vi.fn()}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load authenticator');
    expect(screen.getByLabelText('Client ID')).toHaveValue('fallback-client-id');
  });
});
