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
  navigate: vi.fn(),
}));

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => testState.navigate,
    useOutlet: () => null,
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
          create: vi.fn(),
          update: vi.fn(),
          destroy: vi.fn(),
        }),
      },
      app: {
        pluginSettingsManager: {
          getRoutePath: () => '/admin/settings/public-forms',
        },
      },
      dataSourceManager: {
        getDataSources: () => testState.dataSources,
      },
      viewer: {
        drawer: vi.fn(),
      },
    }),
    useFlowEngine: () => ({}),
  };
});

beforeEach(() => {
  testState.dataSources = [];
  testState.list.mockReset();
  testState.navigate.mockReset();
  testState.list.mockResolvedValue({
    data: {
      data: [],
      meta: {
        count: 0,
      },
    },
  });
});

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

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

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
