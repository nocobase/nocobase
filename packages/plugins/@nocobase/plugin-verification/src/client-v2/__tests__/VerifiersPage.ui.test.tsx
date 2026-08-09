/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VerifiersPage from '../pages/VerifiersPage';

const pageMocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  refresh: vi.fn(),
  resource: {
    create: vi.fn(),
    destroy: vi.fn(),
    list: vi.fn(),
    listTypes: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@nocobase/client-v2', () => ({
  DrawerFormLayout: ({ children }: React.PropsWithChildren) => <>{children}</>,
  Table: () => <div role="table" />,
  useApp: () => ({ pm: { get: () => undefined } }),
}));

vi.mock('@nocobase/flow-engine', () => ({
  randomId: () => 'v_generated',
  useFlowContext: () => ({
    api: {
      resource: () => pageMocks.resource,
    },
    viewer: {
      drawer: vi.fn(),
    },
  }),
}));

vi.mock('ahooks', () => ({
  useMemoizedFn: (fn: unknown) => fn,
  useRequest: (_service: () => Promise<unknown>, options?: { cacheKey?: string }) => {
    if (options?.cacheKey) {
      return { data: [], loading: false, refresh: vi.fn() };
    }
    return {
      data: { records: [], total: 0 },
      loading: false,
      refresh: pageMocks.refresh,
    };
  },
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({ modal: { confirm: pageMocks.confirm } }),
    },
    theme: {
      ...actual.theme,
      useToken: () => ({ token: { margin: 16, marginSM: 12 } }),
    },
  };
});

vi.mock('../locale', () => ({
  useT: () => (value: string) => value,
  useVerificationTranslation: () => ({ t: (value: string) => value }),
}));

vi.mock('../plugin', () => ({
  default: class PluginVerificationClientV2 {},
}));

describe('VerifiersPage toolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes the verifier list from the refresh button', () => {
    render(<VerifiersPage />);

    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));

    expect(pageMocks.refresh).toHaveBeenCalledTimes(1);
  });
});
