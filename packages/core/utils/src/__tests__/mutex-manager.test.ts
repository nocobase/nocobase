import { Application } from '@nocobase/server';
import { Database } from '@nocobase/database';
import { mockServer } from '@nocobase/test';

import Plugin from '@nocobase/plugin-sequence-field';

describe('test mutex-manager with redis-mutex off', () => {
  let app: Application;
  let db: Database;

  beforeEach(async () => {
    process.env.REDIS_MUTEX = 'off';
    app = mockServer();
    app.plugin(Plugin);
    db = app.db;
    await db.sync({
      force: true,
      alter: {
        drop: true,
      },
    });
    await app.load();
    await app.start();
  });

  afterEach(async () => {
    await db.close();
  });

  test('with sequence filed', async () => {
    db.collection({
      name: 'tests',
      fields: [
        {
          type: 'sequence',
          name: 'name',
          patterns: [
            {
              type: 'integer',
              options: { key: 1 },
            },
          ],
        },
      ],
    });
    await db.sync();
    const items = await db.sequelize.transaction(async (transaction) => {
      const TestModel = db.getModel('tests');
      return await Promise.all([
        TestModel.create({}, { transaction }),
        TestModel.create({}, { transaction }),
        TestModel.create({}, { transaction }),
        TestModel.create({}, { transaction }),
        TestModel.create({}, { transaction }),
      ]);
    });
    console.log(JSON.stringify(items.map((i) => i.get('name'))));
    expect(items[0].get('name') != items[1].get('name')).toBeTruthy();
    expect(items[1].get('name') != items[2].get('name')).toBeTruthy();
    expect(items[2].get('name') != items[3].get('name')).toBeTruthy();
    expect(items[3].get('name') != items[4].get('name')).toBeTruthy();
  });

  test('with sort field', async () => {
    db.collection({
      name: 'tests',
      fields: [
        {
          type: 'sort',
          name: 'name',
          patterns: [
            {
              type: 'integer',
              options: { key: 1 },
            },
          ],
        },
      ],
    });
    await db.sync();
    const items = await db.sequelize.transaction(async (transaction) => {
      const TestModel = db.getModel('tests');
      return await Promise.all([
        TestModel.create({}, { transaction }),
        TestModel.create({}, { transaction }),
        TestModel.create({}, { transaction }),
        TestModel.create({}, { transaction }),
        TestModel.create({}, { transaction }),
      ]);
    });
    console.log(JSON.stringify(items.map((i) => i.get('name'))));
    expect(items[0].get('name') != items[1].get('name')).toBeTruthy();
    expect(items[1].get('name') != items[2].get('name')).toBeTruthy();
    expect(items[2].get('name') != items[3].get('name')).toBeTruthy();
    expect(items[3].get('name') != items[4].get('name')).toBeTruthy();
  });
});

// comment out this test without redis service

// describe('test mutex-manager with redis-mutex on', () => {
//   let app: Application;
//   let db: Database;

//   beforeEach(async () => {
//     process.env.REDIS_MUTEX = 'on';
//     app = mockServer();
//     app.plugin(Plugin);
//     db = app.db;
//     await db.sync({
//       force: true,
//       alter: {
//         drop: true,
//       },
//     });
//     await app.load();
//     await app.start();
//   });

//   afterEach(async () => {
//     await db.close();
//   });

//   test('with sequence filed', async () => {
//     db.collection({
//       name: 'tests',
//       fields: [
//         {
//           type: 'sequence',
//           name: 'name',
//           patterns: [
//             {
//               type: 'integer',
//               options: { key: 1 },
//             },
//           ],
//         },
//       ],
//     });
//     await db.sync();
//     const items = await db.sequelize.transaction(async (transaction) => {
//       const TestModel = db.getModel('tests');
//       return await Promise.all([
//         TestModel.create({}, { transaction }),
//         TestModel.create({}, { transaction }),
//         TestModel.create({}, { transaction }),
//         TestModel.create({}, { transaction }),
//         TestModel.create({}, { transaction }),
//       ]);
//     });
//     console.log(JSON.stringify(items.map((i) => i.get('name'))));
//     expect(items[0].get('name') != items[1].get('name')).toBeTruthy();
//     expect(items[1].get('name') != items[2].get('name')).toBeTruthy();
//     expect(items[2].get('name') != items[3].get('name')).toBeTruthy();
//     expect(items[3].get('name') != items[4].get('name')).toBeTruthy();
//   });

//   test('with sort filed', async () => {
//     db.collection({
//       name: 'tests',
//       fields: [
//         {
//           type: 'sort',
//           name: 'name',
//           patterns: [
//             {
//               type: 'integer',
//               options: { key: 1 },
//             },
//           ],
//         },
//       ],
//     });
//     await db.sync();
//     const items = await db.sequelize.transaction(async (transaction) => {
//       const TestModel = db.getModel('tests');
//       return await Promise.all([
//         TestModel.create({}, { transaction }),
//         TestModel.create({}, { transaction }),
//         TestModel.create({}, { transaction }),
//         TestModel.create({}, { transaction }),
//         TestModel.create({}, { transaction }),
//       ]);
//     });
//     console.log(JSON.stringify(items.map((i) => i.get('name'))));
//     expect(items[0].get('name') != items[1].get('name')).toBeTruthy();
//     expect(items[1].get('name') != items[2].get('name')).toBeTruthy();
//     expect(items[2].get('name') != items[3].get('name')).toBeTruthy();
//     expect(items[3].get('name') != items[4].get('name')).toBeTruthy();
//   });
// });
