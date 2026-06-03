/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from 'antd';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowEngine } from '@nocobase/flow-engine';
import { MemoryRouter } from 'react-router-dom';
import PublicFormsSettingsLayoutModel from '../models/PublicFormsSettingsLayoutModel';
import PublicFormsSettingsPage, {
  fromCollectionCascaderValue,
  toCollectionCascaderValue,
} from '../pages/PublicFormsSettingsPage';

const testState = vi.hoisted(() => ({
  dataSources: [] as {
    key: string;
    displayName?: string;
    getCollections: () => {
      filterTargetKey?: string;
      name: string;
      title?: string;
    }[];
  }[],
  list: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  navigate: vi.fn(),
  viewerDrawer: vi.fn(),
  outlet: null as unknown,
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    Dropdown: ({
      children,
      menu,
    }: {
      children?: React.ReactNode;
      menu?: {
        items?: {
          key?: React.Key;
          label?: React.ReactNode;
          type?: string;
        }[];
      };
    }) =>
      React.createElement(
        'div',
        null,
        children,
        React.createElement(
          'div',
          { role: 'menu' },
          menu?.items
            ?.filter((item) => item?.type !== 'divider')
            .map((item) =>
              React.createElement(
                'div',
                {
                  key: item.key,
                  role: 'menuitem',
                },
                item.label,
              ),
            ),
        ),
      ),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => testState.navigate,
    useOutlet: () => testState.outlet,
  };
});

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    DrawerFormLayout: (props: {
      children?: React.ReactNode;
      onSubmit?: () => void | Promise<void>;
      submitText?: React.ReactNode;
      title?: React.ReactNode;
    }) =>
      React.createElement(
        'div',
        { role: 'dialog' },
        React.createElement('h2', null, props.title),
        props.children,
        React.createElement(
          'button',
          {
            onClick: props.onSubmit,
            type: 'button',
          },
          props.submitText || 'Submit',
        ),
      ),
    EnvVariableInput: ({ password, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { password?: boolean }) =>
      React.createElement('input', {
        ...props,
        'aria-label': 'Password',
        type: password ? 'password' : 'text',
      }),
  };
});

vi.mock('@nocobase/flow-engine', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine');

  return {
    ...actual,
    useFlowContext: () => ({
      api: {
        resource: () => ({
          list: testState.list,
          get: testState.get,
          create: vi.fn(),
          update: testState.update,
          destroy: vi.fn(),
        }),
      },
      app: {
        router: {
          getBasename: () => '',
        },
        pluginSettingsManager: {
          getRoutePath: () => '/admin/settings/public-forms',
        },
      },
      dataSourceManager: {
        getDataSources: () => testState.dataSources,
      },
      viewer: {
        drawer: testState.viewerDrawer,
      },
    }),
    useFlowEngine: () => ({}),
  };
});

beforeEach(() => {
  testState.dataSources = [];
  testState.list.mockReset();
  testState.get.mockReset();
  testState.update.mockReset();
  testState.navigate.mockReset();
  testState.viewerDrawer.mockReset();
  testState.outlet = null;
  testState.list.mockResolvedValue({
    data: {
      data: [],
      meta: {
        count: 0,
      },
    },
  });
});

function createSettingsLayoutModel() {
  const flowEngine = new FlowEngine();
  const model = new PublicFormsSettingsLayoutModel({
    uid: 'public-forms-settings-layout-model-test',
    flowEngine,
    props: {
      layout: {
        routeName: 'admin.settings.public-forms.index.layout',
        routePath: 'configure',
        rootRouteName: 'admin',
        uid: 'public-forms-settings-layout-model',
        layoutModelClass: 'PublicFormsSettingsLayoutModel',
        rootPageModelClass: 'RootPageModel',
        childPageModelClass: 'ChildPageModel',
        authCheck: true,
      },
    },
  });

  model.currentLayoutRoute = {
    type: 'page',
    pathname: '/admin/settings/public-forms/configure/form-1',
    basePathname: '/admin/settings/public-forms/configure',
    relativePath: 'form-1',
    pageUid: 'form-1',
    viewStack: [{ viewUid: 'form-1' }],
  };

  return model;
}

function SettingsLayoutHarness() {
  const [drawerContent, setDrawerContent] = React.useState<React.ReactNode>(null);
  const model = React.useMemo(() => createSettingsLayoutModel(), []);

  React.useEffect(() => {
    testState.viewerDrawer.mockImplementation(({ content }: { content: () => React.ReactNode }) => {
      setDrawerContent(content());
    });
  }, []);

  return React.createElement(React.Fragment, null, model.render(), drawerContent);
}

describe('PublicFormsSettingsPage collection cascader value', () => {
  it('converts stored collection values to cascader paths', () => {
    expect(toCollectionCascaderValue('main:users')).toEqual(['main', 'users']);
    expect(toCollectionCascaderValue('users')).toEqual(['main', 'users']);
  });

  it('converts cascader paths to stored collection values', () => {
    expect(fromCollectionCascaderValue(['main', 'users'])).toBe('main:users');
    expect(fromCollectionCascaderValue('main:users')).toBe('main:users');
  });
});

describe('PublicFormsSettingsPage toolbar', () => {
  it('refreshes the public form list from the toolbar', async () => {
    render(React.createElement(App, null, React.createElement(PublicFormsSettingsPage)));

    await waitFor(() => {
      expect(testState.list).toHaveBeenCalledTimes(1);
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });

    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(testState.list).toHaveBeenCalledTimes(2);
    });
  });

  it('renders read-pretty collection, type, and enabled values', async () => {
    testState.dataSources = [
      {
        key: 'main',
        displayName: 'Main',
        getCollections: () => [
          {
            name: 'users',
            title: 'Users',
            filterTargetKey: 'id',
          },
        ],
      },
    ];
    testState.list.mockResolvedValue({
      data: {
        data: [
          {
            key: 'form-1',
            title: 'Form 1',
            collection: 'main:users',
            type: 'form',
            enabled: true,
          },
        ],
        meta: {
          count: 1,
        },
      },
    });

    const { container } = render(React.createElement(App, null, React.createElement(PublicFormsSettingsPage)));

    expect(await screen.findByText('Main / Users')).toBeTruthy();
    expect(screen.getByText('Form')).toBeTruthy();
    expect(container.querySelector('.anticon-check')).toBeTruthy();
  });
});

describe('PublicFormsSettingsLayoutModel password settings', () => {
  it('updates password without remounting the configured form outlet', async () => {
    testState.outlet = React.createElement('div', { 'data-testid': 'settings-outlet' }, 'Configured form blocks');
    testState.get.mockResolvedValue({
      data: {
        data: {
          key: 'form-1',
          title: 'Form 1',
          enabled: true,
          password: 'old-password',
        },
      },
    });
    testState.update.mockResolvedValue({});

    render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(App, null, React.createElement(SettingsLayoutHarness)),
      ),
    );

    expect(await screen.findByText('Form 1')).toBeTruthy();
    expect(screen.getByTestId('settings-outlet')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Settings/i }));
    fireEvent.click(await screen.findByText('Set password'));
    fireEvent.change(screen.getByLabelText('Password'), {
      target: {
        value: 'new-password',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(testState.update).toHaveBeenCalledWith({
        filterByTk: 'form-1',
        values: {
          password: 'new-password',
        },
      });
    });
    expect(testState.get).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('settings-outlet')).toBeTruthy();
  });
});
