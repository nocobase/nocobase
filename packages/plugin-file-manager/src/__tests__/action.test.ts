import path from 'path';
import { FILE_FIELD_NAME } from '../constants';
import { getApp, getAgent } from '.';

describe('user fields', () => {
  let app;
  let agent;
  let db;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
    db = app.database;
    await db.sync({ force: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('', () => {
    it('', async () => {
      const response = await agent
        .post('/api/attachments:upload')
        .attach(FILE_FIELD_NAME, path.resolve(__dirname, './files/text.txt'));
      console.log(response.body);
    });
  });
});
