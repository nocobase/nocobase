/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import UsersManagementPage from '../pages/UsersManagementPage';

const { open } = vi.hoisted(() => ({
  open: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  useACLRoleContext: () => ({
    parseAction: (action: string) => (action === 'users:create' ? null : {}),
  }),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    dataSourceManager: {
      getDataSource: () => ({
        getCollection: () => ({}),
      }),
    },
    viewer: {
      open,
    },
    api: {
      resource: () => ({
        destroy: vi.fn(),
        list: vi.fn().mockResolvedValue({ data: { data: [], meta: {} } }),
      }),
    },
    message: {
      success: vi.fn(),
    },
  }),
}));

vi.mock('../components/resource', () => ({
  ResourceTablePage: ({
    toolbar,
  }: {
    toolbar: (args: { refresh: () => void; refreshAsync: () => Promise<void> }) => React.ReactNode;
  }) => <div>{toolbar({ refresh: vi.fn(), refreshAsync: vi.fn().mockResolvedValue(undefined) })}</div>,
  SettingsActionCell: () => null,
}));

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

vi.mock('../pages/UserFormDrawer', () => ({
  default: () => <div>UserFormDrawer</div>,
}));

vi.mock('../pages/ChangeUserPasswordDrawer', () => ({
  default: () => <div>ChangeUserPasswordDrawer</div>,
}));

vi.mock('../pages/UsersSettingsForm', () => ({
  default: () => <div>UsersSettingsForm</div>,
}));

describe('UsersManagementPage', () => {
  it('shows the add user action even when users:create is not granted', () => {
    render(<UsersManagementPage />);

    expect(screen.getByRole('button', { name: /Add new/ })).toBeInTheDocument();
  });
});
