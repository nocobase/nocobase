import { MockServer } from '@nocobase/test';
import createApp from './index';
import { Dumper } from '../dumper';
import { Restorer } from '../restorer';
import path from 'path';
import fs from 'fs';

describe('dumper', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createApp();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should dump and restore map file', async () => {
    await app.runAsCLI(['pm', 'enable', 'map'], { from: 'user' });

    const fields = [
      {
        type: 'point',
        name: 'point',
      },
      {
        type: 'polygon',
        name: 'polygon',
      },
      {
        type: 'circle',
        name: 'circle',
      },
      {
        type: 'lineString',
        name: 'lineString',
      },
    ];

    await app.db.getRepository('collections').create({
      values: {
        name: 'tests',
        fields,
      },
      context: {},
    });

    await app.db.getRepository('tests').create({
      values: {
        point: [1, 2],
        polygon: [
          [3, 4],
          [5, 6],
        ],
        circle: [1, 2, 0.5],
        lineString: [
          [5, 6],
          [7, 8],
        ],
      },
    });

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      dataTypes: new Set(['meta', 'business']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      dataTypes: new Set(['meta', 'business']),
    });

    const testCollection = app.db.getCollection('tests');
    const tableInfo = await app.db.sequelize.getQueryInterface().describeTable(testCollection.getTableNameWithSchema());

    expect(tableInfo.point).toBeDefined();
  });

  it('should save dump meta to dump file', async () => {
    const dumper = new Dumper(app);
    const result = await dumper.dump({
      dataTypes: new Set(['meta']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    const meta = await restorer.parseBackupFile();
    expect(meta.dumpableCollectionsGroupByDataTypes.meta).toBeTruthy();
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

  it('should run dump task', async () => {
    const dumper = new Dumper(app);

    const taskId = await dumper.runDumpTask({
      dataTypes: new Set(['meta']),
    });

    expect(taskId).toBeDefined();

    const promise = Dumper.getTaskPromise(taskId);
    expect(promise).toBeDefined();

    await promise;
  });

  it('should create dump file name', async () => {
    expect(Dumper.generateFileName()).toMatch(/^backup_\d{8}_\d{6}_\d{4}\.nbdump$/);
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

  it('should dump collection table structure', async () => {
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
    await dumper.dumpCollection({
      name: 'test_collection',
    });

    const collectionDir = path.resolve(dumper.workDir, 'collections', 'test_collection');
    const metaFile = path.resolve(collectionDir, 'meta');
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

    const attributes = meta.attributes;
    expect(attributes).toBeDefined();
    expect(attributes.id.isCollectionField).toBeFalsy();
    expect(attributes.id.type).toBe('BIGINT');

    expect(attributes['test_field1'].isCollectionField).toBeTruthy();
    expect(attributes['test_field1'].type).toBe('string');
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
