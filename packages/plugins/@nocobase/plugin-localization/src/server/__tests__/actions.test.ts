/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('actions', () => {
  describe('localizations', () => {
    let app: MockServer;
    let db: Database;
    let repo: Repository;
    let agent;

    const clear = async () => {
      await repo.destroy({
        truncate: true,
      });
      await db.getRepository('localizationTranslations').destroy({
        truncate: true,
      });
    };

    beforeAll(async () => {
      process.env.APP_ENV = 'production';
      app = await createMockServer({
        plugins: ['localization'],
      });
      await app.emitAsync('afterLoad');
      db = app.db;
      repo = db.getRepository('localizationTexts');
      agent = app.agent();
    });

    afterAll(async () => {
      await app.destroy();
    });

    describe('list', () => {
      beforeAll(async () => {
        await repo.create({
          values: [
            {
              module: 'test',
              text: 'text',
              translations: [
                {
                  locale: 'en-US',
                  translation: 'translation',
                },
              ],
            },
            {
              module: 'test',
              text: 'text1',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: 'translation1',
                },
              ],
            },
          ],
        });
      });

      afterAll(async () => {
        await clear();
      });

      it('should list localization texts', async () => {
        const res = await agent.set('X-Locale', 'en-US').resource('localizationTexts').list();
        expect(res.body.data.length).toBe(2);
        expect(res.body.data[0].text).toBe('text');
        expect(res.body.data[0].translation).toBe('translation');
        expect(res.body.data[0].translationId).toBe(1);

        const res2 = await agent.set('X-Locale', 'zh-CN').resource('localizationTexts').list();
        expect(res2.body.data.length).toBe(2);
        expect(res2.body.data[0].text).toBe('text');
        expect(res2.body.data[0].translation).toBeUndefined();
      });

      it('should search by keyword', async () => {
        let res = await agent.set('X-Locale', 'zh-CN').resource('localizationTexts').list({
          keyword: 'text',
        });
        expect(res.body.data.length).toBe(2);

        res = await agent.set('X-Locale', 'en-US').resource('localizationTexts').list({
          keyword: 'translation',
        });
        expect(res.body.data.length).toBe(1);
      });

      it('should filter no translation', async () => {
        const res = await agent.set('X-Locale', 'zh-CN').resource('localizationTexts').list({
          keyword: 'text',
          hasTranslation: 'false',
        });
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].text).toBe('text');
        expect(res.body.data[0].translation).toBeUndefined();
      });
    });

    it('publish', async () => {
      await repo.create({
        values: [
          {
            module: 'test',
            text: 'text',
            translations: [
              {
                locale: 'en-US',
                translation: 'translation',
              },
            ],
          },
        ],
      });
      const { resources } = await app.localeManager.get('en-US');
      expect(resources.test).toBeUndefined();
      await agent.resource('localization').publish();
      const { resources: resources2 } = await app.localeManager.get('en-US');
      expect(resources2.test).toBeDefined();
      expect(resources2.test.text).toBe('translation');
    });

    describe('translation packs', () => {
      afterEach(async () => {
        await clear();
      });

      it('should export translations by locale and module', async () => {
        await repo.create({
          values: [
            {
              module: 'resources.test',
              text: 'text',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: '文本',
                },
              ],
            },
            {
              module: 'resources.test',
              text: 'missing',
              translations: [
                {
                  locale: 'en-US',
                  translation: 'Missing',
                },
              ],
            },
            {
              module: 'resources.other',
              text: 'other',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: '其他',
                },
              ],
            },
          ],
        });

        const res = await agent.resource('localization').export({
          values: {
            locale: 'zh-CN',
            modules: ['test'],
          },
        });

        expect(res.body.data).toMatchObject({
          locale: 'zh-CN',
          referenceLocale: 'en-US',
          entries: [
            {
              module: 'resources.test',
              text: 'missing',
              translation: '',
              referenceTranslation: 'Missing',
            },
            {
              module: 'resources.test',
              text: 'text',
              translation: '文本',
            },
          ],
        });
      });

      it('should export translated texts', async () => {
        await repo.create({
          values: [
            {
              module: 'resources.test',
              text: 'translated',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: '已翻译',
                },
              ],
            },
            {
              module: 'resources.test',
              text: 'missing',
              translations: [
                {
                  locale: 'en-US',
                  translation: 'Missing',
                },
              ],
            },
            {
              module: 'resources.test',
              text: 'empty',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: '',
                },
                {
                  locale: 'en-US',
                  translation: 'Empty',
                },
              ],
            },
          ],
        });

        const res = await agent.resource('localization').export({
          values: {
            locale: 'zh-CN',
            hasTranslation: true,
          },
        });

        expect(res.body.data.entries).toEqual([
          {
            module: 'resources.test',
            text: 'translated',
            translation: '已翻译',
          },
        ]);
      });

      it('should export untranslated texts', async () => {
        await repo.create({
          values: [
            {
              module: 'resources.test',
              text: 'translated',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: '已翻译',
                },
              ],
            },
            {
              module: 'resources.test',
              text: 'missing',
              translations: [
                {
                  locale: 'en-US',
                  translation: 'Missing',
                },
              ],
            },
            {
              module: 'resources.test',
              text: 'empty',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: '',
                },
                {
                  locale: 'en-US',
                  translation: 'Empty',
                },
              ],
            },
          ],
        });

        const res = await agent.resource('localization').export({
          values: {
            locale: 'zh-CN',
            hasTranslation: false,
            includeEmpty: true,
          },
        });

        expect(res.body.data.entries).toEqual([
          {
            module: 'resources.test',
            text: 'empty',
            translation: '',
            referenceTranslation: 'Empty',
          },
          {
            module: 'resources.test',
            text: 'missing',
            translation: '',
            referenceTranslation: 'Missing',
          },
        ]);
      });

      it('should import translations in createOnly mode without overwriting', async () => {
        await repo.create({
          values: [
            {
              module: 'resources.test',
              text: 'exists',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: '已有',
                },
              ],
            },
          ],
        });

        const res = await agent.resource('localization').import({
          values: {
            locale: 'zh-CN',
            mode: 'createOnly',
            entries: [
              {
                module: 'test',
                text: 'exists',
                translation: '覆盖',
              },
              {
                module: 'test',
                text: 'new',
                translation: '新增',
              },
            ],
          },
        });

        expect(res.body.data.summary).toMatchObject({
          total: 2,
          createdTexts: 1,
          createdTranslations: 1,
          updatedTranslations: 0,
          skipped: 1,
          invalid: 0,
        });

        const texts = await repo.find({
          filter: {
            module: 'resources.test',
          },
          sort: ['text'],
          appends: ['translations'],
        });
        expect(texts.map((text) => text.text)).toEqual(['exists', 'new']);
        expect(texts[0].translations[0].translation).toBe('已有');
        expect(texts[1].translations[0].translation).toBe('新增');
      });

      it('should update translations in upsert mode and skip empty values', async () => {
        await repo.create({
          values: [
            {
              module: 'resources.test',
              text: 'exists',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: '旧值',
                },
              ],
            },
          ],
        });

        const res = await agent.resource('localization').import({
          values: {
            locale: 'zh-CN',
            mode: 'upsert',
            entries: [
              {
                module: 'resources.test',
                text: 'exists',
                translation: '新值',
              },
              {
                module: 'resources.test',
                text: 'empty',
                translation: '',
              },
            ],
          },
        });

        expect(res.body.data.summary).toMatchObject({
          total: 2,
          createdTexts: 0,
          createdTranslations: 0,
          updatedTranslations: 1,
          skipped: 1,
          invalid: 0,
        });

        const text = await repo.findOne({
          filter: {
            module: 'resources.test',
            text: 'exists',
          },
          appends: ['translations'],
        });
        expect(text.translations[0].translation).toBe('新值');
      });

      it('should overwrite translations with empty values', async () => {
        await repo.create({
          values: [
            {
              module: 'resources.test',
              text: 'exists',
              translations: [
                {
                  locale: 'zh-CN',
                  translation: '旧值',
                },
              ],
            },
          ],
        });

        const res = await agent.resource('localization').import({
          values: {
            locale: 'zh-CN',
            mode: 'overwrite',
            entries: [
              {
                module: 'resources.test',
                text: 'exists',
                translation: '',
              },
            ],
          },
        });

        expect(res.body.data.summary.updatedTranslations).toBe(1);
        const text = await repo.findOne({
          filter: {
            module: 'resources.test',
            text: 'exists',
          },
          appends: ['translations'],
        });
        expect(text.translations[0].translation).toBe('');
      });

      it('should dry run imports without writing records', async () => {
        const res = await agent.resource('localization').import({
          values: {
            locale: 'zh-CN',
            dryRun: true,
            entries: [
              {
                module: 'resources.test',
                text: 'new',
                translation: '新增',
              },
            ],
          },
        });

        expect(res.body.data.summary).toMatchObject({
          total: 1,
          createdTexts: 1,
          createdTranslations: 1,
        });
        expect(await repo.count()).toBe(0);
      });

      it('should publish imported translations', async () => {
        const { resources } = await app.localeManager.get('zh-CN');
        expect(resources.test).toBeUndefined();

        await agent.resource('localization').import({
          values: {
            locale: 'zh-CN',
            publish: true,
            entries: [
              {
                module: 'resources.test',
                text: 'published',
                translation: '已发布',
              },
            ],
          },
        });

        const { resources: publishedResources } = await app.localeManager.get('zh-CN');
        expect(publishedResources.test.published).toBe('已发布');
      });
    });
  });
});
