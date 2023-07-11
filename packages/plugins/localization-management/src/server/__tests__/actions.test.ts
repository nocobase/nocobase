import Database, { Repository } from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import Plugin from '..';

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
      app = mockServer();
      app.plugin(Plugin);
      await app.loadAndInstall({ clean: true });
      db = app.db;
      repo = db.getRepository('localizationTexts');

      agent = app.agent();
    });

    afterAll(async () => {
      await db.close();
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
                  locale: 'en-US',
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
        const res = await agent.set('X-Locale', 'en-US').resource('localization').list();
        expect(res.body.data.length).toBe(2);
        expect(res.body.data[0].text).toBe('text');
        expect(res.body.data[0].translation).toBe('translation');
        expect(res.body.data[0].translationId).toBe(1);

        const res2 = await agent.set('X-Locale', 'zh-CN').resource('localization').list();
        expect(res2.body.data.length).toBe(2);
        expect(res2.body.data[0].text).toBe('text');
        expect(res2.body.data[0].translation).toBeUndefined();
      });

      it('should search by text', async () => {
        const res = await agent.set('X-Locale', 'zh-CN').resource('localization').list({
          searchType: 'text',
          keyword: 'text1',
        });
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].text).toBe('text1');
        expect(res.body.data[0].translation).toBeUndefined();
      });

      it('shouold search by translation', async () => {
        const res = await agent.set('X-Locale', 'en-US').resource('localization').list({
          searchType: 'translation',
          keyword: 'translation1',
        });
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].text).toBe('text1');
        expect(res.body.data[0].translation).toBe('translation1');
      });

      it('should filter no translation', async () => {
        const res = await agent.set('X-Locale', 'zh-CN').resource('localization').list({
          searchType: 'text',
          keyword: 'text1',
          hasTranslation: 'false',
        });
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].text).toBe('text1');
        expect(res.body.data[0].translation).toBeUndefined();
      });
    });

    describe('update & destroy', () => {
      afterEach(async () => {
        await clear();
      });

      it('should update localization text with translation', async () => {
        const text = await repo.create({
          values: {
            module: 'test',
            text: 'text',
          },
        });
        const res = await agent.set('X-Locale', '').resource('localization').update();
        expect(res.status).toBe(400);

        await agent
          .set('X-Locale', 'en-US')
          .resource('localization')
          .update({
            values: {
              id: text.id,
              translation: 'translation1',
            },
          });
        const t1 = await db.getRepository('localizationTranslations').findOne({
          filter: {
            locale: 'en-US',
            textId: text.id,
          },
        });
        expect(t1.translation).toBe('translation1');

        await agent
          .set('X-Locale', 'en-US')
          .resource('localization')
          .update({
            values: {
              id: text.id,
              translation: 'translation2',
            },
          });
        const t2 = await db.getRepository('localizationTranslations').findOne({
          filter: {
            locale: 'en-US',
            textId: text.id,
          },
        });
        expect(t2.translation).toBe('translation2');
      });

      it('should destory translation', async () => {
        const text = await repo.create({
          values: {
            module: 'test',
            text: 'text',
            translations: [
              {
                locale: 'en-US',
                translation: 'translation',
              },
            ],
          },
        });
        const t = await db.getRepository('localizationTranslations').findOne({
          filter: {
            locale: 'en-US',
            textId: text.id,
          },
        });
        const translationId = t.id;

        await agent.resource('localization').destroyTranslation({
          values: { id: translationId },
        });
        const tExists = await db.getRepository('localizationTranslations').findOne({
          filter: {
            id: translationId,
          },
        });
        expect(tExists).toBeNull();
      });
    });
  });
});
