/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHookWithApp, waitFor } from '@nocobase/test/client';
import { CurrentAppInfoProvider, useCurrentAppInfo } from '@nocobase/client';

describe('CurrentAppInfoProvider', () => {
  it('should work', async () => {
    const { result } = await renderHookWithApp({
      hook: useCurrentAppInfo,
      Wrapper: CurrentAppInfoProvider,
      apis: {
        'app:getInfo': {
          database: {
            dialect: 'mysql',
          },
          lang: 'zh-CN',
          version: '1.0.0',
        },
      },
    });
    await waitFor(() => {
      expect(result.current).toEqual({
        database: {
          dialect: 'mysql',
        },
        lang: 'zh-CN',
        version: '1.0.0',
      });
    });
  });
});
