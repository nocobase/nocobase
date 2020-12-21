import { promises as fs } from 'fs';
import path from 'path';
import { FILE_FIELD_NAME, STORAGE_TYPE_LOCAL } from '../constants';
import { getApp, getAgent, getAPI } from '.';

describe('action', () => {
  let app;
  let agent;
  let api;
  let db;

  beforeEach(async () => {
    app = await getApp();
    agent = getAgent(app);
    api = getAPI(app);
    db = app.database;

    const Storage = app.database.getModel('storages');
    await Storage.create({
      name: `local_${Date.now().toString(36)}`,
      type: STORAGE_TYPE_LOCAL,
      baseUrl: 'http://localhost/uploads',
      default: true
    });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('direct attachment', () => {
    it('upload file should be ok', async () => {
      const response = await agent
        .post('/api/attachments:upload')
        .attach(FILE_FIELD_NAME, path.resolve(__dirname, './files/text.txt'));
      
      const matcher = {
        name: 'text',
        extname: '.txt',
        path: '',
        size: 13,
        mimetype: 'text/plain',
        meta: {},
        storage_id: 1,
      };
      expect(response.body).toMatchObject(matcher);

      const Attachment = db.getModel('attachments');
      const attachment = await Attachment.findOne({
        where: { id: response.body.id },
        include: ['storage']
      });
      const storage = attachment.get('storage');
      expect(attachment).toMatchObject(matcher);
      expect(storage).toMatchObject({
        type: 'local',
        options: {},
        rules: {},
        path: '',
        baseUrl: 'http://localhost/uploads',
        default: true,
      });

      const { documentRoot = 'uploads' } = storage.options || {};
      const destPath = path.resolve(path.isAbsolute(documentRoot) ? documentRoot : path.join(process.env.PWD, documentRoot), storage.path);
      const file = await fs.stat(destPath);
      expect(file).toBeDefined();
    });
  });

  describe.skip('associated attachment', () => {
    it('', async () => {
      const User = db.getModel('users');
      const user = await User.create();
      const response = await api.resource('users.avatar').upload({
        associatedKey: user.id
      });
      console.log(response.body);
    });

    it('', async () => {
      const response = await api.resource('users/_/avatar').upload({
      });
      console.log(response.body);
    });
  });
});
