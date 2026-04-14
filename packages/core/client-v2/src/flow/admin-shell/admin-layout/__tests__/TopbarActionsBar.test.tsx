/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { allowMock, flowModelRendererSpy } = vi.hoisted(() => {
  return {
    allowMock: vi.fn(),
    flowModelRendererSpy: vi.fn(),
  };
});

vi.mock('../../../../acl/useAclSnippets', () => {
  return {
    useAclSnippets: () => ({
      allow: allowMock,
    }),
  };
});

vi.mock('../HelpLite', () => {
  return {
    HelpLite: () => <div data-testid="help-lite" />,
  };
});

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    FlowModelRenderer: (props: any) => {
      flowModelRendererSpy(props);

      if (props.model?.shouldThrow) {
        throw new Error('broken topbar action');
      }

      return <div data-testid={`flow-model-${props.model.uid}`}>{props.model.uid}</div>;
    },
  };
});

import { TopbarActionsBar, getVisibleTopbarActions } from '../TopbarActionsBar';
import { getTopbarPluginSettingsItems } from '../../../models/topbar/TopbarActionModel';

const createAction = (options: Record<string, any>) => {
  return {
    sort: 0,
    aclSnippet: undefined,
    hidden: false,
    isHidden() {
      return !!this.hidden;
    },
    ...options,
  } as any;
};

describe('TopbarActionsBar helpers', () => {
  beforeEach(() => {
    allowMock.mockReset();
    flowModelRendererSpy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should filter hidden actions first and keep sort stable', () => {
    const allow = vi.fn((snippet: string) => snippet !== 'deny');
    const hiddenAction = createAction({
      uid: 'hidden',
      sort: 0,
      aclSnippet: 'deny',
      hidden: true,
    });
    const first = createAction({
      uid: 'first',
      sort: 0,
    });
    const second = createAction({
      uid: 'second',
      sort: 0,
    });
    const last = createAction({
      uid: 'last',
      sort: 10,
      aclSnippet: 'allow',
    });

    const actions = getVisibleTopbarActions([last, hiddenAction, second, first], allow);

    expect(actions.map((action) => action.uid)).toEqual(['second', 'first', 'last']);
    expect(allow).toHaveBeenCalledTimes(1);
    expect(allow).toHaveBeenCalledWith('allow');
  });

  it('should build plugin settings dropdown items with plugin manager and grouped settings', () => {
    const items = getTopbarPluginSettingsItems({
      canManagePlugins: true,
      t: (key) => key,
      settings: [
        {
          key: 'plugin-manager',
          name: 'plugin-manager',
          title: 'Plugin manager',
          path: '/admin/settings/plugin-manager',
          icon: null,
          componentLoader: async () => null,
        },
        {
          key: 'system-settings',
          name: 'system-settings',
          title: 'System settings',
          path: '/admin/settings/system-settings',
          icon: null,
          isPinned: true,
          componentLoader: async () => null,
        },
        {
          key: 'security',
          name: 'security',
          title: 'Security',
          path: '/admin/settings/security',
          icon: null,
          componentLoader: async () => null,
        },
      ] as any,
    });

    expect((items as any[]).map((item) => item.type || item.key)).toEqual([
      'plugin-manager',
      'divider',
      'system-settings',
      'divider',
      'security',
    ]);
    expect((items as any[])[2]).toMatchObject({
      key: 'system-settings',
      name: 'system-settings',
      path: '/admin/settings/system-settings',
    });
  });

  it('should return empty dropdown items when plugin manager and settings are both unavailable', () => {
    const items = getTopbarPluginSettingsItems({
      canManagePlugins: false,
      t: (key) => key,
      settings: [],
    });

    expect(items).toEqual([]);
  });

  it('should not inject hidden plugin manager into topbar dropdown', () => {
    const items = getTopbarPluginSettingsItems({
      canManagePlugins: true,
      t: (key) => key,
      settings: [
        {
          key: 'plugin-manager',
          name: 'plugin-manager',
          title: 'Plugin manager',
          path: '/admin/settings/plugin-manager',
          icon: null,
          hidden: true,
        },
      ] as any,
    });

    expect(items).toEqual([]);
  });
});

describe('TopbarActionsBar', () => {
  beforeEach(() => {
    allowMock.mockReset();
    allowMock.mockReturnValue(true);
    flowModelRendererSpy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should keep HelpLite rendered when one action fails', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TopbarActionsBar
        actions={[
          createAction({ uid: 'good-1' }),
          createAction({ uid: 'bad', shouldThrow: true }),
          createAction({ uid: 'good-2' }),
        ]}
      />,
    );

    expect(screen.getByTestId('flow-model-good-1')).toBeInTheDocument();
    expect(screen.queryByTestId('flow-model-bad')).not.toBeInTheDocument();
    expect(screen.getByTestId('flow-model-good-2')).toBeInTheDocument();
    expect(screen.getByTestId('help-lite')).toBeInTheDocument();
  });
});
