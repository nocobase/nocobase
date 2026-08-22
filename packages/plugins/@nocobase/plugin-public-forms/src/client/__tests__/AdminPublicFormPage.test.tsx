/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@nocobase/test/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminPublicFormPage } from '../components/AdminPublicFormPage';

const testState = vi.hoisted(() => ({
  record: {
    data: {
      enabled: true,
      key: 'legacy-form',
      title: 'Legacy public form',
      version: 'v1',
    },
  } as { data?: Record<string, unknown> },
  refresh: vi.fn(),
}));

vi.mock('react-router', () => ({
  useParams: () => ({
    name: 'public-form-1',
  }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children }: React.PropsWithChildren) => <a>{children}</a>,
}));

vi.mock('@formily/antd-v5', () => ({
  FormLayout: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('@ant-design/pro-layout', () => ({
  PageHeader: ({ style, title }: { style?: React.CSSProperties; title?: React.ReactNode }) => (
    <header data-testid="v2-settings-header" style={style}>
      {title}
    </header>
  ),
}));

vi.mock('../hooks', () => ({
  usePublicSubmitActionProps: vi.fn(),
}));

vi.mock('@nocobase/client', () => ({
  ApplicationContext: React.createContext({}),
  Checkbox: () => null,
  FormDialog: () => ({
    open: vi.fn(),
  }),
  FormItem: ({ children }: React.PropsWithChildren) => <>{children}</>,
  PoweredBy: () => <div>Powered by NocoBase</div>,
  RemoteSchemaComponent: ({ uid }: { uid: string }) => <div data-testid="legacy-admin-public-form">{uid}</div>,
  SchemaComponent: () => null,
  SchemaComponentOptions: ({ children }: React.PropsWithChildren) => <>{children}</>,
  TextAreaWithGlobalScope: () => null,
  VariablesProvider: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useAPIClient: () => ({
    resource: () => ({
      update: vi.fn(),
    }),
  }),
  useApp: () => ({
    getHref: (path: string) => `/${path}`,
  }),
  useCompile: () => (value: string) => value,
  useGlobalTheme: () => ({
    theme: {},
  }),
  useGlobalVariable: () => ({}),
  useRequest: () => ({
    data: testState.record,
    loading: false,
    refresh: testState.refresh,
  }),
}));

vi.mock('../locale', () => ({
  NAMESPACE: 'public-forms',
  usePublicFormTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../client-v2/pages/PublicFormsSettingsDetailPage', () => ({
  PublicFormsSettingsDetailContent: ({ pageUid }: { pageUid?: string }) => (
    <div data-testid="v2-admin-public-form">{pageUid}</div>
  ),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');

  return {
    ...actual,
    Breadcrumb: ({ items }: { items?: { title?: React.ReactNode }[] }) => (
      <nav>{items?.map((item, index) => <span key={index}>{item.title}</span>)}</nav>
    ),
    Button: ({ children }: React.PropsWithChildren) => <button>{children}</button>,
    Dropdown: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    Popover: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    QRCode: () => <div />,
    Space: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    Spin: () => <div>Loading</div>,
    Switch: () => <input type="checkbox" />,
    theme: {
      useToken: () => ({
        token: {
          colorBgContainer: '#fff',
          colorBgLayout: '#f5f5f5',
          colorBorderSecondary: '#eee',
          controlHeightLG: 40,
          lineWidth: 1,
          marginLG: 24,
          padding: 16,
          paddingLG: 24,
          paddingSM: 12,
        },
      }),
    },
  };
});

describe('AdminPublicFormPage', () => {
  beforeEach(() => {
    testState.record = {
      data: {
        enabled: true,
        key: 'legacy-form',
        title: 'Legacy public form',
        version: 'v1',
      },
    };
    testState.refresh.mockReset();
  });

  it('keeps legacy v1 public forms on the RemoteSchemaComponent settings page', () => {
    render(<AdminPublicFormPage />);

    expect(screen.getByTestId('legacy-admin-public-form')).toHaveTextContent('public-form-1');
    expect(screen.queryByTestId('v2-admin-public-form')).toBeNull();
  });

  it('routes v2 public forms to the v2 FlowModel settings page from the v1 settings URL', () => {
    testState.record = {
      data: {
        enabled: true,
        key: 'public-form-1',
        title: 'V2 public form',
        version: 'v2',
      },
    };

    render(<AdminPublicFormPage />);

    expect(screen.getByTestId('v2-admin-public-form')).toHaveTextContent('public-form-1');
    expect(screen.getByTestId('v2-settings-header')).toHaveTextContent('Public forms');
    expect(screen.getByTestId('v2-settings-header')).toHaveStyle({
      paddingTop: '12px',
      paddingBottom: '12px',
    });
    expect(screen.getByTestId('v2-settings-header').parentElement).toHaveStyle({
      marginTop: '-54px',
    });
    expect(screen.queryByTestId('legacy-admin-public-form')).toBeNull();
  });
});
