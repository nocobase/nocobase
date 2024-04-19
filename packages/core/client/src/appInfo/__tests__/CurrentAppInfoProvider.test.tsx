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
