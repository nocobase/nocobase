import { Database, mockDatabase } from '@nocobase/database';
import { ViewFieldInference } from '../../view/view-inference';

describe('view inference', function () {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should infer collection fields', async () => {
    const UserCollection = db.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'age',
          type: 'integer',
        },
        {
          name: 'profile',
          type: 'json',
        },
        {
          name: 'posts',
          type: 'hasMany',
        },
      ],
    });

    const PostCollection = db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'user',
          type: 'belongsTo',
        },
      ],
    });

    await db.sync();

    const viewName = 'user_posts';

    const viewSQL = `
       CREATE OR REPLACE VIEW public.${viewName} as SELECT 1 as const_field, * FROM ${UserCollection.quotedTableName()} as users
    `;

    await db.sequelize.query(viewSQL);

    const inferredFields = await ViewFieldInference.inferFields({
      db,
      viewName,
      viewSchema: 'public',
    });

    const createdAt = UserCollection.model.rawAttributes['createdAt'].field;
    expect(inferredFields[createdAt]['type']).toBe('date');

    expect(inferredFields['name']).toMatchObject({
      name: 'name',
      type: 'string',
      source: 'users.name',
    });

    expect(inferredFields['const_field']).toMatchObject({
      name: 'const_field',
      type: 'integer',
    });
  });
});
