/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { PortalEntryActionModel } from '../PortalEntryActionModel';
import { getPortalEntryActionStore } from '../portalEntryActionStore';

describe('PortalEntryActionModel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createAppPortalsApiClient(payload: unknown) {
    const apiClient = {
      silent: () => apiClient,
      request: vi.fn(async () => ({
        data: {
          data: payload,
        },
      })),
    };
    return apiClient;
  }

  function loadEntryPortalAvailability(model: PortalEntryActionModel) {
    return (model as unknown as { loadEntryPortalAvailability: () => Promise<void> }).loadEntryPortalAvailability();
  }

  it('uses latest portal app metadata from app:getPortals payload when opening', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const app = {
      name: 'main',
      getRouteUrl: (pathname: string) => `/v${pathname}`,
    };
    getPortalEntryActionStore(app as never).payload = {
      apps: [
        {
          name: 'alpha',
          ssoEnabled: true,
        },
      ],
      portals: [
        {
          uid: 'workspace',
          appName: 'alpha',
          routePath: '/workspace',
        },
      ],
    };
    const model = Object.create(PortalEntryActionModel.prototype) as PortalEntryActionModel;
    Object.defineProperty(model, 'context', { value: { app } });
    Object.assign(model, {
      entryActionAvailability: 'available',
      hidden: false,
      props: {
        entryPortal: {
          uid: 'workspace',
          appName: 'alpha',
          routePath: '/old-workspace',
        },
        entryPortalApp: {
          name: 'alpha',
          ssoEnabled: false,
        },
      },
    });

    model.onClick();

    expect(open).toHaveBeenCalledWith('/v/apps/alpha/app-sso?redirect=%2Fworkspace', '_blank', 'noopener,noreferrer');
  });

  it('marks missing portal as unavailable when target app is not running', async () => {
    const app = {
      apiClient: createAppPortalsApiClient({
        apps: [
          {
            name: 'alpha',
            status: 'stopped',
          },
        ],
        portals: [],
      }),
    };
    const model = Object.create(PortalEntryActionModel.prototype) as PortalEntryActionModel;
    Object.defineProperty(model, 'context', {
      value: {
        app,
        t: (key: string) => key,
      },
    });
    Object.assign(model, {
      entryActionAvailability: 'available',
      props: {
        entryPortal: {
          uid: 'workspace',
          appName: 'alpha',
          routePath: '/workspace',
        },
      },
    });

    await loadEntryPortalAvailability(model);

    expect(model.isEntryActionAvailable()).toBe(false);
    expect(model.getEntryActionUnavailableMessage()).toBe(
      'This entry is currently unavailable. Please check the application status.',
    );
  });
});
