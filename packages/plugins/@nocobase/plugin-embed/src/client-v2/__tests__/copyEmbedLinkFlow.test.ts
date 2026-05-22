/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { registerExtraMenuItems } = vi.hoisted(() => ({
  registerExtraMenuItems: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  RootPageModel: {
    registerExtraMenuItems,
  },
}));

describe('copyEmbedLinkFlow', () => {
  beforeEach(() => {
    vi.resetModules();
    registerExtraMenuItems.mockClear();
  });

  it('should build embed link from app public path and root page parent id', async () => {
    const { buildEmbedLink } = await import('../copyEmbedLinkFlow');
    const link = buildEmbedLink({
      uid: 'page-model',
      parentId: 'page-uid',
      context: {
        app: {
          getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
        },
      },
    } as any);

    expect(link).toBe(new URL('/v2/embed/page-uid', window.location.origin).toString());
  });

  it('should build embed link from router basename in sub app', async () => {
    const { buildEmbedLink } = await import('../copyEmbedLinkFlow');
    const link = buildEmbedLink({
      uid: 'page-model',
      parentId: 'page-uid',
      context: {
        app: {
          router: {
            getBasename: () => '/v2/apps/app1',
          },
          getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
        },
      },
    } as any);

    expect(link).toBe(new URL('/v2/apps/app1/embed/page-uid', window.location.origin).toString());
  });

  it('should build embed link from current sub app basename', async () => {
    const { buildEmbedLink } = await import('../copyEmbedLinkFlow');
    const link = buildEmbedLink({
      uid: 'page-model',
      parentId: 'cd57hg1ja87',
      context: {
        app: {
          router: {
            getBasename: () => '/v2/apps/a_nrjks1i93jh',
          },
          getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
        },
      },
    } as any);

    expect(link).toBe(new URL('/v2/apps/a_nrjks1i93jh/embed/cd57hg1ja87', window.location.origin).toString());
  });

  it('should register extra menu only once', async () => {
    const { registerCopyEmbedLinkFlow } = await import('../copyEmbedLinkFlow');

    registerCopyEmbedLinkFlow();
    registerCopyEmbedLinkFlow();

    expect(registerExtraMenuItems).toHaveBeenCalledTimes(1);
    expect(registerExtraMenuItems).toHaveBeenCalledWith(
      expect.objectContaining({
        keyPrefix: 'embed.copyEmbeddedLink',
        group: 'common-actions',
      }),
    );
  });
});
