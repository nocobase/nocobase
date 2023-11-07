import { MockServer } from '@nocobase/test';
import createApp from './index';
import { Dumper } from '../dumper';
import path from 'path';

describe('dumper', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('get file status', function () {
    it('should get in progress status', async () => {
      const fileName = 'backup_20231111_112233.nbdump';
      const fullPath = path.resolve(__dirname, './fixtures', fileName);

      const status = await Dumper.getFileStatus(fullPath);
      expect(status['inProgress']).toBeTruthy();
    });

    it('should get ok status', async () => {
      const dumper = new Dumper(app);
      const result = await dumper.dump({
        dataTypes: new Set(['meta']),
      });

      const status = await Dumper.getFileStatus(result.filePath);
      expect(status['inProgress']).toBeFalsy();
    });

    it('should throw error when file not exists', async () => {
      expect(Dumper.getFileStatus('not_exists_file')).rejects.toThrowError();
    });
  });

  it('should create dump file name', async () => {
    expect(Dumper.generateFileName()).toMatch(/^backup_\d{8}_\d{6}\.nbdump$/);
  });

  it('should get dumped collections by data types', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test_collection',
        fields: [
          {
            name: 'test_field1',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const dumper = new Dumper(app);
    const collections = await dumper.getCollectionsByDataTypes(new Set(['business']));
    expect(collections.includes('test_collection')).toBeTruthy();
  });

  it('should get dumped collections with origin option', async () => {
    const dumper = new Dumper(app);
    const dumpableCollections = await dumper.dumpableCollections();
    const applicationPlugins = dumpableCollections.find(({ name }) => name === 'applicationPlugins');

    expect(applicationPlugins.origin).toMatchObject({
      title: 'core',
      name: 'core',
    });
  });
});
