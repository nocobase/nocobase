/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, HasManyRepository, createMockDatabase } from '@nocobase/database';

describe('multi target key in association repository', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
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
        autoGenId: false,
        filterTargetKey: ['name', 'author'],
        fields: [
          {
            name: 'name',
            type: 'string',
            primaryKey: true,
          },
          {
            name: 'author',
            type: 'string',
            primaryKey: true,
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
        updateAssociationValues: ['books'],
        values: [
          {
            name: 's1',
            classId: 1,
            age: 10,
            books: [
              {
                name: 'b1',
                author: 'a1',
              },
              {
                name: 'b2',
                author: 'a1',
              },
            ],
          },
          {
            name: 's2',
            classId: 2,
            age: 11,
            books: [
              {
                name: 'b3',
                author: 'a1',
              },
            ],
          },
        ],
      });

      const hasManyRepo = db.getRepository<HasManyRepository>(
        'students.books',
        encodeURIComponent(JSON.stringify({ name: 's1', classId: 1 })),
      );

      const res = await hasManyRepo.find();

      expect(res.length).toBe(2);

      const b2a1 = await hasManyRepo.findOne({
        filterByTk: {
          name: 'b2',
          author: 'a1',
        },
      });

      expect(b2a1).toBeDefined();
      expect(b2a1.get('name')).toBe('b2');
      expect(b2a1.get('author')).toBe('a1');

      await db
        .getRepository<HasManyRepository>('students.books', {
          name: 's2',
          classId: 2,
        })
        .destroy({});

      expect(await db.getRepository('books').count()).toBe(2);
    });
  });
});
