/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { LocalePlugin } from '../LocalePlugin';

describe('LocalePlugin', () => {
  it('should not interrupt app bootstrap when app:getLang returns maintaining error', async () => {
    const defineProperty = vi.fn();
    const app = {
      apiClient: {
        auth: {
          locale: 'en-US',
        },
        request: vi.fn().mockRejectedValue({
          response: {
            data: {
              error: {
                code: 'APP_NOT_FOUND',
                maintaining: true,
              },
            },
          },
        }),
      },
      use: vi.fn(),
      i18n: {
        changeLanguage: vi.fn(),
        addResources: vi.fn(),
      },
      flowEngine: {
        context: {
          defineProperty,
        },
      },
    };
    const plugin = new LocalePlugin({ name: 'builtin-locale' } as any, app as any);

    await expect(plugin.afterAdd()).resolves.toBeUndefined();

    expect(app.apiClient.request).toHaveBeenCalledTimes(1);
    expect(app.use).toHaveBeenCalledTimes(1);
    expect(defineProperty).toHaveBeenCalledWith('locales', { value: {} });
  });

  it('should still throw non-maintaining errors from app:getLang', async () => {
    const error = new Error('boom');
    const app = {
      apiClient: {
        auth: {
          locale: 'en-US',
        },
        request: vi.fn().mockRejectedValue(error),
      },
      use: vi.fn(),
      i18n: {
        changeLanguage: vi.fn(),
        addResources: vi.fn(),
      },
      flowEngine: {
        context: {
          defineProperty: vi.fn(),
        },
      },
    };
    const plugin = new LocalePlugin({ name: 'builtin-locale' } as any, app as any);

    await expect(plugin.afterAdd()).rejects.toBe(error);
  });
});
