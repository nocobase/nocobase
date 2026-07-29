/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { listAppPortals } from '../appPortals';

describe('listAppPortals', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes hidden sub apps in portal app metadata', async () => {
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      getAppSsoIssuer: () => undefined,
      getAppsStatuses: vi.fn(async () => ({
        alpha: 'stopped',
        main: 'running',
      })),
      getAppManifests: vi.fn(async () => ({})),
      listAppModels: vi.fn(async () => [
        {
          name: 'alpha',
          title: 'Alpha',
          options: {
            hidden: true,
          },
        },
      ]),
    } as unknown as AppSupervisor);

    const result = await listAppPortals('main');

    expect(result.apps).toEqual([
      {
        name: 'alpha',
        title: 'Alpha',
        icon: null,
        cname: null,
        ssoEnabled: false,
        target: '_blank',
        status: 'stopped',
      },
      {
        name: 'main',
        title: 'Main',
        icon: null,
        status: 'running',
      },
    ]);
  });

  it('returns only real portal manifests and preserves portal type per app', async () => {
    const getAppManifests = vi.fn(async () => ({
      alpha: [
        {
          uid: 'alpha-ai',
          title: 'Alpha AI',
          icon: 'RobotOutlined',
          portalType: 'ai',
          routePath: '/assistant',
          layout: 'desktop',
        },
      ],
      main: [
        {
          uid: 'admin-layout-model',
          title: 'Desktop',
          icon: 'DesktopOutlined',
          portalType: 'no-code',
          routePath: '/admin',
          layout: 'desktop',
        },
      ],
    }));
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      getAppSsoIssuer: () => undefined,
      getAppsStatuses: vi.fn(async () => ({
        alpha: 'running',
        main: 'running',
      })),
      getAppManifests,
      listAppModels: vi.fn(async () => [
        {
          name: 'alpha',
          title: 'Alpha',
        },
      ]),
    } as unknown as AppSupervisor);

    const result = await listAppPortals('main');

    expect(getAppManifests).toHaveBeenCalledWith('multi-portal', ['main', 'alpha']);
    expect(result.portals).toEqual([
      {
        uid: 'admin-layout-model',
        appName: 'main',
        title: 'Desktop',
        icon: 'DesktopOutlined',
        portalType: 'no-code',
        routePath: '/admin',
        layout: 'desktop',
      },
      {
        uid: 'alpha-ai',
        appName: 'alpha',
        title: 'Alpha AI',
        icon: 'RobotOutlined',
        portalType: 'ai',
        routePath: '/assistant',
        layout: 'desktop',
      },
    ]);
    expect(result.portals).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uid: '__default_admin__' }),
        expect.objectContaining({ uid: '__default_mobile__' }),
      ]),
    );
  });
});
