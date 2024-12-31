import { Database, MigrationContext } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '..';
import Migrator from '../../migrations/20241230000001-update-bigint-to-unixtimestamp';

describe('update bigint to unixTimestamp', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should update bigInt fields with unixTimestamp interface', async () => {
    const collectionsRepository = db.getRepository('collections');
    const fieldsRepository = db.getRepository('fields');

    // Create a test collection
    await collectionsRepository.create({
      values: {
        name: 'test',
        title: 'Test Collection',
      },
    });

    const oldUiSchema = {
      'x-component-props': {
        accuracy: 'second',
        showTime: true,
      },
      type: 'number',
      'x-component': 'UnixTimestamp',
      title: 'unix-time',
    };

    // Create test fields
    await fieldsRepository.create({
      values: {
        collectionName: 'test',
        type: 'bigInt',
        name: 'timestamp_field',
        interface: 'unixTimestamp',
        uiSchema: oldUiSchema,
      },
    });

    // Create a control field that should not be updated
    await fieldsRepository.create({
      values: {
        collectionName: 'test',
        type: 'bigInt',
        name: 'normal_bigint',
        interface: 'integer',
      },
    });

    // Run the migration
    const migration = new Migrator({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    // Verify the results
    const updatedField = await fieldsRepository.findOne({
      filter: {
        name: 'timestamp_field',
        collectionName: 'test',
      },
    });

    const controlField = await fieldsRepository.findOne({
      filter: {
        name: 'normal_bigint',
        collectionName: 'test',
      },
    });

    // Check if the target field was updated
    expect(updatedField.get('type')).toBe('unixTimestamp');

    // Check if the uiSchema was updated correctly
    const updatedUiSchema = updatedField.get('uiSchema');
    expect(updatedUiSchema).toMatchObject({
      ...oldUiSchema,
      'x-component-props': {
        ...oldUiSchema['x-component-props'],
        showTime: true,
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
      },
    });

    // Check if the control field remained unchanged
    expect(controlField.get('type')).toBe('bigInt');
  });
});
