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
import { listAppPortals, normalizeAppPortalFrontend } from '../appPortals';

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

  it('normalizes legacy layout and the frozen frontend manifest union', async () => {
    vi.spyOn(AppSupervisor, 'getInstance').mockReturnValue({
      getAppSsoIssuer: () => undefined,
      getAppsStatuses: vi.fn(async () => ({ main: 'running' })),
      getAppManifests: vi.fn(async () => ({
        main: [
          {
            uid: 'legacy-layout',
            routePath: '/legacy-layout',
            layout: 'desktop',
          },
          {
            uid: 'modern-layout',
            routePath: '/modern-layout',
            layout: 'legacy-value',
            frontend: { type: 'layout', layoutUid: 'mobile' },
          },
          {
            uid: 'customer-app',
            routePath: '/customer',
            layout: 'legacy-value',
            frontend: { type: 'client-app', entryId: 'customer-entry' },
          },
        ],
      })),
      listAppModels: vi.fn(async () => []),
    } as unknown as AppSupervisor);

    const result = await listAppPortals('main');

    expect(result.portals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uid: '__default_admin__',
          layout: 'desktop',
          frontend: { type: 'layout', layoutUid: 'desktop' },
        }),
        expect.objectContaining({
          uid: 'legacy-layout',
          layout: 'desktop',
          frontend: { type: 'layout', layoutUid: 'desktop' },
        }),
        expect.objectContaining({
          uid: 'modern-layout',
          layout: 'mobile',
          frontend: { type: 'layout', layoutUid: 'mobile' },
        }),
        expect.objectContaining({
          uid: 'customer-app',
          layout: null,
          frontend: { type: 'client-app', entryId: 'customer-entry' },
        }),
      ]),
    );
  });

  it('does not reinterpret an invalid explicit frontend binding as a legacy layout', () => {
    expect(
      normalizeAppPortalFrontend({
        layout: 'desktop',
        frontend: { type: 'client-app', entryId: ' ' },
      }),
    ).toBeUndefined();
  });
});
