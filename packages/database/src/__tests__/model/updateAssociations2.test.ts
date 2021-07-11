import { getDatabase } from '..';
import Database from '../..';

let db: Database;

beforeEach(async () => {
  db = getDatabase();
  db.table({
    name: 'routes',
    fields: [
      {
        type: 'uid',
        name: 'key',
        prefix: 'r_',
        primaryKey: true,
      },
      {
        type: 'belongsTo',
        name: 'uiSchema',
        target: 'ui_schemas',
      },
    ],
  });
  db.table({
    name: 'ui_schemas',
    fields: [
      {
        type: 'uid',
        name: 'key',
        primaryKey: true,
      },
      {
        type: 'string',
        name: 'name',
      },
    ],
  });
  await db.sync();
});

afterEach(async () => {
  await db.close();
});

describe('updateAssociations', () => {
  it('belongsTo', async () => {
    const [Route, Schema] = db.getModels(['routes', 'ui_schemas']);
    const route = await Route.create();
    await route.updateAssociations({
      uiSchema: {
        key: '6kyo0t1jnpw',
        // name: '6kyo0t1jnpw'
      },
    });
    const schema = await Schema.findByPk('6kyo0t1jnpw');
    expect(schema).toBeDefined();
  });
});
