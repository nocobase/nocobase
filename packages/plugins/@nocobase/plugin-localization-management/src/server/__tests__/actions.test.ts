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
      app = await createMockServer({
        plugins: ['localization-management'],
      });
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
  });
});
