import { uid } from '@nocobase/utils';
import { Database, mockDatabase, ViewFieldInference } from '../../index';
import { pgOnly } from '@nocobase/test';

pgOnly()('view with association', () => {
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

  it('should use view hash id as primary key', async () => {
    const UserGroupCollection = db.collection({
      name: 'user_group',
      fields: [
        { name: 'user', type: 'belongsTo', foreignKey: 'user_id' },
        {
          name: 'group',
          type: 'belongsTo',
          foreignKey: 'group_id',
        },
      ],
    });

    const GroupCollection = db.collection({
      name: 'groups',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'users',
          through: 'user_group',
          foreignKey: 'group_id',
          otherKey: 'user_id',
          sourceKey: 'id',
          targetKey: 'id',
        },
      ],
    });

    const UserCollection = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'groups',
          through: 'user_group',
          foreignKey: 'user_id',
          otherKey: 'group_id',
          sourceKey: 'id',
          targetKey: 'id',
        },
      ],
    });

    await db.sync();

    const g1 = await GroupCollection.repository.create({
      values: { name: 'g1' },
    });

    const g2 = await GroupCollection.repository.create({
      values: { name: 'g2' },
    });

    const u1 = await UserCollection.repository.create({
      values: { name: 'u1', groups: [g1, g2] },
    });

    const u2 = await UserCollection.repository.create({
      values: { name: 'u2', groups: [g1, g2] },
    });

    const viewName = `t_${uid(6)}`;
    const dropSQL = `DROP VIEW IF EXISTS ${viewName};`;
    await db.sequelize.query(dropSQL);

    const viewSQL = `CREATE VIEW public.${viewName} AS select group_id, user_id, MD5(user_id::text || group_id::text) AS id from ${UserGroupCollection.quotedTableName()}`;

    await db.sequelize.query(viewSQL);

    const inferResult = await ViewFieldInference.inferFields({
      db,
      viewName,
      viewSchema: 'public',
    });

    const UserGroupViewCollection = db.collection({
      name: viewName,
      view: true,
      schema: db.inDialect('postgres') ? 'public' : undefined,
      fields: Object.values(inferResult),
    });

    const userGroups = await UserGroupViewCollection.repository.find({
      appends: ['user', 'group'],
    });

    expect(userGroups.length).toBe(4);

    const u1Groups = await UserGroupViewCollection.repository.find({
      appends: ['user', 'group'],
      filter: {
        user_id: u1.id,
      },
    });

    expect(u1Groups.length).toBe(2);
    for (const userGroup of u1Groups) {
      expect(userGroup.user_id).toBe(u1.id);
    }
  });
});
