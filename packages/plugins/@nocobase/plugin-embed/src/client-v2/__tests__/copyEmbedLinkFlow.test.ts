/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowModel } from '@nocobase/flow-engine';

const { registerExtraMenuItems } = vi.hoisted(() => ({
  registerExtraMenuItems: vi.fn(),
}));
const { copy } = vi.hoisted(() => ({
  copy: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  RootPageModel: {
    registerExtraMenuItems,
  },
}));

vi.mock('copy-to-clipboard', () => ({
  default: copy,
}));

describe('copyEmbedLinkFlow', () => {
  beforeEach(() => {
    vi.resetModules();
    registerExtraMenuItems.mockClear();
    copy.mockReset();
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
    } as unknown as FlowModel);

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
    } as unknown as FlowModel);

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
    } as unknown as FlowModel);

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

    const options = registerExtraMenuItems.mock.calls[0][0];
    expect(options.matcher({ uid: 'page-model', context: {} })).toBe(true);
    expect(options.matcher({ uid: '', context: {} })).toBe(false);
  });

  it('should copy embed link and show the success message from i18n', async () => {
    copy.mockReturnValueOnce(true);
    const { registerCopyEmbedLinkFlow } = await import('../copyEmbedLinkFlow');
    const model = {
      uid: 'page-model',
      parentId: 'page-uid',
      context: {
        app: {
          getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
        },
        i18n: {
          t: vi.fn((key: string) => `i18n:${key}`),
        },
        message: {
          success: vi.fn(),
          error: vi.fn(),
        },
      },
    } as unknown as FlowModel;

    registerCopyEmbedLinkFlow();
    const options = registerExtraMenuItems.mock.calls[0][0];
    const item = options.items(model, (key: string) => `fallback:${key}`)[0];
    item.onClick();

    expect(item.label).toBe('i18n:Copy embedded link');
    expect(copy).toHaveBeenCalledWith(new URL('/v2/embed/page-uid', window.location.origin).toString());
    expect(model.context.message.success).toHaveBeenCalledWith('i18n:Copy successful');
    expect(model.context.message.error).not.toHaveBeenCalled();
  });

  it('should show an error message when copying embed link fails', async () => {
    copy.mockReturnValueOnce(false);
    const { registerCopyEmbedLinkFlow } = await import('../copyEmbedLinkFlow');
    const model = {
      uid: 'page-model',
      context: {
        app: {},
        message: {
          success: vi.fn(),
          error: vi.fn(),
        },
      },
    } as unknown as FlowModel;

    registerCopyEmbedLinkFlow();
    const options = registerExtraMenuItems.mock.calls[0][0];
    const item = options.items(model, (key: string) => `fallback:${key}`)[0];
    item.onClick();

    expect(copy).toHaveBeenCalledWith(new URL('/embed/page-model', window.location.origin).toString());
    expect(model.context.message.success).not.toHaveBeenCalled();
    expect(model.context.message.error).toHaveBeenCalledWith('fallback:Copy Failed');
  });
});
