/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EntryActionManager, type Application } from '@nocobase/client-v2';
import type { FlowModelContext, SubModelItem } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { registerPortalEntryActions } from '../registerPortalEntryActions';

const portals = [
  {
    uid: 'desktop-portal',
    appName: 'main',
    title: 'Desktop portal',
    routePath: '/desktop-portal',
    layout: 'desktop',
  },
  {
    uid: 'mobile-portal',
    appName: 'main',
    title: 'Mobile portal',
    routePath: '/mobile-portal',
    layout: 'mobile',
  },
];

function createApp(portalRecords = portals) {
  const entryActionManager = new EntryActionManager();
  const apiClient = {
    request: vi.fn(async () => ({
      data: {
        data: {
          apps: [],
          portals: portalRecords,
        },
      },
    })),
  };

  return {
    app: {
      apiClient,
      entryActionManager,
    } as unknown as Application,
    apiClient,
    entryActionManager,
  };
}

function getPortalActionKeys(items: SubModelItem[]) {
  const children = items[0]?.children;
  return Array.isArray(children) ? children.map((item) => item.key) : undefined;
}

function getPortalActionLabels(items: SubModelItem[]) {
  const children = items[0]?.children;
  return Array.isArray(children) ? children.map((item) => item.label) : undefined;
}

function getPortalActionTitles(items: SubModelItem[]) {
  const children = items[0]?.children;
  if (!Array.isArray(children)) {
    return undefined;
  }
  return children.map((item) => {
    const props = item.createModelOptions?.props as
      | {
          entryPortalTargetTitle?: string;
          entryPortalTitle?: string;
          title?: string;
        }
      | undefined;
    return {
      entryPortalTargetTitle: props?.entryPortalTargetTitle,
      entryPortalTitle: props?.entryPortalTitle,
      title: props?.title,
    };
  });
}

describe('registerPortalEntryActions', () => {
  it.each([
    ['app-switcher', 'desktop'],
    ['app-switcher', 'mobile'],
    ['action-panel', 'desktop'],
    ['action-panel', 'mobile'],
  ])('lists portals from both layouts in the %s scope on %s layouts', async (scope, layoutType) => {
    const { app, apiClient, entryActionManager } = createApp();
    registerPortalEntryActions(app, (key) => key);

    const items = await entryActionManager.getItems(scope)({
      layout: {
        layoutType,
      },
    } as unknown as FlowModelContext);

    expect(getPortalActionKeys(items as SubModelItem[])).toEqual([
      'multi-portal:portal:main:desktop-portal',
      'multi-portal:portal:main:mobile-portal',
    ]);
    expect(apiClient.request).toHaveBeenCalledWith({
      url: 'app:getPortals',
      skipNotify: true,
    });
  });

  it('distinguishes same-app Portal titles that span desktop and mobile layouts', async () => {
    const { app, entryActionManager } = createApp([
      {
        ...portals[0],
        title: 'Workspace',
      },
      {
        ...portals[1],
        title: 'Workspace',
      },
    ]);
    registerPortalEntryActions(app, (key) => key);

    const items = await entryActionManager.getItems('app-switcher')({} as FlowModelContext);

    expect(getPortalActionLabels(items as SubModelItem[])).toEqual(['Workspace (Desktop)', 'Workspace (Mobile)']);
    expect(getPortalActionTitles(items as SubModelItem[])).toEqual([
      {
        entryPortalTargetTitle: 'Main application / Workspace (Desktop)',
        entryPortalTitle: 'Main application / Workspace (Desktop)',
        title: 'Main application / Workspace (Desktop)',
      },
      {
        entryPortalTargetTitle: 'Main application / Workspace (Mobile)',
        entryPortalTitle: 'Main application / Workspace (Mobile)',
        title: 'Main application / Workspace (Mobile)',
      },
    ]);
  });
});
