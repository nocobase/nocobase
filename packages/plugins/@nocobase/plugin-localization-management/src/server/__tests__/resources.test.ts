import { CacheManager } from '@nocobase/cache';
import Resources from '../resources';

describe('resources', () => {
  let resources: Resources;

  beforeAll(async () => {
    const cacheManager = new CacheManager();
    const cache = await cacheManager.createCache({ name: 'locale', store: 'memory' });
    resources = new Resources(
      {
        getRepository: (name: string) => {
          if (name === 'localizationTexts') {
            return {
              find: () => [
                { id: 1, module: 'resources.client', text: 'Edit' },
                { id: 2, module: 'resources.client', text: 'Add new' },
                { id: 3, module: 'resources.acl', text: 'Admin' },
              ],
            };
          }
          if (name === 'localizationTranslations') {
            return {
              find: () => [
                { textId: 1, translation: '编辑' },
                { textId: 3, translation: '管理员' },
              ],
            };
          }
        },
      } as any,
      cache,
    );
  });

  test('getTexts', async () => {
    const texts = await resources.getTexts();
    expect(texts).toBeDefined();
    const cache = await resources.cache.get('texts');
    expect(cache).toBeDefined();
  });

  test('getTranslations', async () => {
    const translations = await resources.getTranslations('zh-CN');
    expect(translations).toBeDefined();
    const cache = await resources.cache.get('translations:zh-CN');
    expect(cache).toBeDefined();
  });

  test('getResources', async () => {
    const result = await resources.getResources('zh-CN');
    expect(result).toEqual({
      'resources.client': {
        Edit: '编辑',
      },
      'resources.acl': {
        Admin: '管理员',
      },
    });
  });

  test('filterExists', async () => {
    const result = await resources.filterExists([
      { text: 'Edit', module: 'resources.client' },
      { text: 'Add new', module: 'resources.client' },
      { text: 'Admin', module: 'resources.acl' },
      { text: 'Test', module: 'resources.acl' },
    ]);
    expect(result).toEqual([
      {
        text: 'Test',
        module: 'resources.acl',
      },
    ]);
  });

  test('updateCacheTexts', async () => {
    const texts = [{ id: 4, module: 'resources.acl', text: 'Test' }];
    await resources.updateCacheTexts(texts);
    const cache = await resources.cache.get('texts');
    expect(cache).toBeDefined();
    expect((cache as any[]).length).toBe(4);
  });
});
