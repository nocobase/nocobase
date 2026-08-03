/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine } from '@nocobase/flow-engine';
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

  it.each([
    ['no-code', '/v/workspace'],
    ['ai', '/x/workspace'],
  ])('opens a main app %s portal with the matching route prefix', (portalType, expectedUrl) => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const app = {
      name: 'main',
      getRouteUrl: (pathname: string) => `/v${pathname}`,
      router: {
        basename: '/v',
      },
    };
    const entryPortal = {
      uid: `${portalType}-workspace`,
      appName: 'main',
      portalType,
      routePath: '/workspace',
    };
    getPortalEntryActionStore(app as never).payload = {
      apps: [],
      portals: [entryPortal],
    };
    const model = Object.create(PortalEntryActionModel.prototype) as PortalEntryActionModel;
    Object.defineProperty(model, 'context', { value: { app } });
    Object.assign(model, {
      entryActionAvailability: 'available',
      hidden: false,
      props: {
        entryPortal,
      },
    });

    model.onClick();

    expect(open).toHaveBeenCalledWith(expectedUrl, '_blank', 'noopener,noreferrer');
  });

  it('opens a main app AI portal from a sub-app without keeping its scope', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const app = {
      name: 'alpha',
      router: {
        basename: '/nocobase/v/apps/alpha',
      },
    };
    const entryPortal = {
      uid: 'main-ai-workspace',
      appName: 'main',
      portalType: 'ai',
      routePath: '/workspace',
    };
    getPortalEntryActionStore(app as never).payload = {
      apps: [],
      portals: [entryPortal],
    };
    const model = Object.create(PortalEntryActionModel.prototype) as PortalEntryActionModel;
    Object.defineProperty(model, 'context', { value: { app } });
    Object.assign(model, {
      entryActionAvailability: 'available',
      hidden: false,
      props: {
        entryPortal,
      },
    });

    model.onClick();

    expect(open).toHaveBeenCalledWith('/nocobase/x/workspace', '_blank', 'noopener,noreferrer');
  });

  it('opens a direct cross-app AI portal with the x route prefix', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const app = {
      name: 'main',
      getRouteUrl: (pathname: string) => `/v${pathname}`,
      router: {
        basename: '/v',
      },
    };
    const entryPortal = {
      uid: 'alpha-ai-workspace',
      appName: 'alpha',
      portalType: 'ai',
      routePath: '/workspace',
    };
    getPortalEntryActionStore(app as never).payload = {
      apps: [
        {
          name: 'alpha',
          ssoEnabled: false,
        },
      ],
      portals: [entryPortal],
    };
    const model = Object.create(PortalEntryActionModel.prototype) as PortalEntryActionModel;
    Object.defineProperty(model, 'context', { value: { app } });
    Object.assign(model, {
      entryActionAvailability: 'available',
      hidden: false,
      props: {
        entryPortal,
      },
    });

    model.onClick();

    expect(open).toHaveBeenCalledWith('/x/apps/alpha/workspace', '_blank', 'noopener,noreferrer');
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

  it('keeps cross-layout title qualifiers when refreshing Portal metadata', async () => {
    const entryPortal = {
      uid: 'desktop-workspace',
      appName: 'main',
      title: 'Workspace',
      routePath: '/desktop-workspace',
      layout: 'desktop',
    };
    const app = {
      apiClient: createAppPortalsApiClient({
        apps: [],
        portals: [
          entryPortal,
          {
            uid: 'mobile-workspace',
            appName: 'main',
            title: 'Workspace',
            routePath: '/mobile-workspace',
            layout: 'mobile',
          },
        ],
      }),
    };
    const flowEngine = new FlowEngine();
    flowEngine.context.defineProperty('app', { value: app });
    flowEngine.registerModels({ PortalEntryActionModel });
    const model = flowEngine.createModel<PortalEntryActionModel>({
      use: 'PortalEntryActionModel',
      props: {
        entryPortal,
        entryPortalTargetTitle: 'Main / Workspace (Desktop)',
        entryPortalTitle: 'Main / Workspace (Desktop)',
        title: 'Main / Workspace (Desktop)',
      },
    });

    await loadEntryPortalAvailability(model);

    expect(model.props.entryPortalTitle).toBe('Workspace (Desktop)');
    expect(model.props.entryPortalTargetTitle).toBe('Main application / Workspace (Desktop)');
    expect(model.props.title).toBe('Workspace (Desktop)');
  });
});
