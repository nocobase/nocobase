/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { HasManyRepository, mockDatabase } from '../../index';
describe('multi target key in association repository', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('use multi target key as source key', async () => {
    test('has many repository', async () => {
      const Student = db.collection({
        name: 'students',
        autoGenId: false,
        filterTargetKey: ['name', 'classId'],
        fields: [
          {
            name: 'name',
            type: 'string',
            primaryKey: true,
          },
          {
            name: 'classId',
            type: 'bigInt',
            primaryKey: true,
          },
          {
            name: 'age',
            type: 'integer',
          },
          {
            name: 'id',
            type: 'uid',
          },
          {
            name: 'books',
            type: 'hasMany',
            target: 'books',
            foreignKey: 'studentId',
            targetKey: 'id',
          },
        ],
      });

      const Book = db.collection({
        name: 'books',
        fields: [
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'student',
            type: 'belongsTo',
            foreignKey: 'studentId',
            targetKey: 'id',
          },
        ],
      });

      await db.sync();

      await Student.repository.create({
        values: {
          name: 's1',
          classId: 1,
          age: 10,
          books: [
            {
              name: 'b1',
            },
            {
              name: 'b2',
            },
          ],
        },
      });

      const hasManyRepo = db.getRepository<HasManyRepository>(
        'students.books',
        encodeURIComponent(JSON.stringify({ name: 's1', classId: 1 })),
      );

      const res = await hasManyRepo.find();

      expect(res.length).toBe(2);
    });
  });
});
