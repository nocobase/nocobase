/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import UserFormDrawer from '../pages/UserFormDrawer';

const { list } = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');

  return {
    ...actual,
    PasswordInput: ({ checkStrength: _checkStrength, ...props }: Record<string, unknown>) => <input {...props} />,
    ResourceFormDrawer: ({
      children,
    }: {
      children?: React.ReactNode | ((props: { form: { setFieldsValue: () => void } }) => React.ReactNode);
    }) => (
      <Form>{typeof children === 'function' ? children({ form: { setFieldsValue: () => undefined } }) : children}</Form>
    ),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');

  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: () => ({
          list,
        }),
      },
      app: {
        pm: {
          get: () => undefined,
        },
      },
    }),
  };
});

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
}));

describe('UserFormDrawer', () => {
  beforeEach(() => {
    list.mockResolvedValue({
      data: {
        data: [],
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should exclude root role from selectable role list request', async () => {
    render(<UserFormDrawer onSubmitted={() => undefined} />);

    await waitFor(() => {
      expect(list).toHaveBeenCalledWith({
        paginate: false,
        showAnonymous: true,
        filter: { 'name.$ne': 'root' },
      });
    });
  });
});
