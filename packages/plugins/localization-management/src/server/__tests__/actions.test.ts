import Database, { Repository } from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';
import Plugin from '..';

describe('actions', () => {
  describe('localizations', () => {
    let app: MockServer;
    let db: Database;
    let repo: Repository;
    let agent;

    beforeAll(async () => {
      app = mockServer();
      app.plugin(Plugin);
      await app.loadAndInstall({ clean: true });
      db = app.db;
      repo = db.getRepository('localizationTexts');

      agent = app.agent();
    });

    afterEach(async () => {
      await repo.destroy({
        truncate: true,
      });
      await db.getRepository('localizationTranslations').destroy({
        truncate: true,
      });
    });

    afterAll(async () => {
      await db.close();
    });

    it('should list localization texts', async () => {
      await repo.create({
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
      const res = await agent.set('X-Locale', 'en-US').resource('localization').list();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].text).toBe('text');
      expect(res.body.data[0].translation).toBe('translation');
      expect(res.body.data[0].translationId).toBe(1);

      const res2 = await agent.set('X-Locale', 'zh-CN').resource('localization').list();
      expect(res2.body.data.length).toBe(1);
      expect(res2.body.data[0].text).toBe('text');
      expect(res2.body.data[0].translation).toBeUndefined();
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
