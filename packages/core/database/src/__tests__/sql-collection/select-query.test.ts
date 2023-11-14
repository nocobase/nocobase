import { SQLModel } from '../../sql-collection/sql-model';
import { Sequelize } from 'sequelize';

describe('select query', () => {
  const model = class extends SQLModel {};
  model.init(null, {
    modelName: 'users',
    tableName: 'users',
    sequelize: new Sequelize({
      dialect: 'postgres',
    }),
  });
  model.sql = 'SELECT * FROM "users"';
  model.collection = {
    fields: new Map(
      Object.entries({
        id: {},
        name: {},
      }),
    ),
  } as any;
  const queryGenerator = model.queryInterface.queryGenerator as any;

  test('plain sql', () => {
    const query = queryGenerator.selectQuery('users', {}, model);
    expect(query).toBe('SELECT * FROM "users";');
  });

  test('attributes', () => {
    const query = queryGenerator.selectQuery('users', { attributes: ['id', 'name'] }, model);
    expect(query).toBe('SELECT "id", "name" FROM (SELECT * FROM "users") AS "users";');
  });

  test('where', () => {
    const query = queryGenerator.selectQuery('users', { where: { id: 1 } }, model);
    expect(query).toBe('SELECT * FROM (SELECT * FROM "users") AS "users" WHERE "users"."id" = 1;');
  });

  test('group', () => {
    const query = queryGenerator.selectQuery('users', { group: 'id' }, model);
    expect(query).toBe('SELECT * FROM (SELECT * FROM "users") AS "users" GROUP BY "id";');
  });

  test('order', () => {
    const query = queryGenerator.selectQuery('users', { order: ['id'] }, model);
    expect(query).toBe('SELECT * FROM (SELECT * FROM "users") AS "users" ORDER BY "users"."id";');
  });

  test('limit, offset', () => {
    const query = queryGenerator.selectQuery('users', { limit: 1, offset: 0 }, model);
    expect(query).toBe('SELECT * FROM (SELECT * FROM "users") AS "users" LIMIT 1 OFFSET 0;');
  });

  test('complex sql', () => {
    const query = queryGenerator.selectQuery(
      'users',
      {
        attributes: ['id', 'name'],
        where: { id: 1 },
        group: 'id',
        order: ['id'],
        limit: 1,
        offset: 0,
      },
      model,
    );
    expect(query).toBe(
      'SELECT "id", "name" FROM (SELECT * FROM "users") AS "users" WHERE "users"."id" = 1 GROUP BY "id" ORDER BY "users"."id" LIMIT 1 OFFSET 0;',
    );
  });
});
