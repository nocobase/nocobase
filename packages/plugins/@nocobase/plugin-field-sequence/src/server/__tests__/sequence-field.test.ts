/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import dayjs from 'dayjs';
import { SequenceField } from '..';

describe('sequence field', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-sequence'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('define', () => {
    it('without any pattern will throw error', async () => {
      expect(() => {
        db.collection({
          name: 'tests',
          fields: [{ type: 'sequence', name: 'name' }],
        });
      }).toThrow();
    });

    it('with empty pattern will throw error', async () => {
      expect(() => {
        db.collection({
          name: 'tests',
          fields: [{ type: 'sequence', name: 'name', patterns: [] }],
        });
      }).toThrow();
    });
  });

  describe('string pattern', () => {
    it('no options', async () => {
      expect(() => {
        db.collection({
          name: 'tests',
          fields: [{ type: 'sequence', name: 'name', patterns: [{ type: 'string' }] }],
        });
      }).toThrow();
    });

    it('constant', async () => {
      db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [{ type: 'string', options: { value: 'abc' } }],
          },
        ],
      });
      await db.sync();

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe('abc');

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe('abc');
    });
  });

  describe('integer pattern', () => {
    it.skip('no key', async () => {
      expect(() => {
        db.collection({
          name: 'tests',
          fields: [{ type: 'sequence', name: 'name', patterns: [{ type: 'integer' }] }],
        });
      }).toThrow();
    });

    it('default start from 0, digits as 1, no cycle', async () => {
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

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe('0');

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe('1');
    });

    it('start from 9', async () => {
      db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              {
                type: 'integer',
                options: {
                  start: 9,
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe('9');

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe('9');
    });

    it('start from 0, current set to 9', async () => {
      const collection = db.collection({
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
      const field = collection.getField('name');
      const SeqRepo = db.getRepository('sequences');
      await SeqRepo.create({});

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe('0');
    });

    it('digits more than 1, start from 9', async () => {
      db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              {
                type: 'integer',
                options: {
                  digits: 2,
                  start: 9,
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe('09');

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe('10');
    });

    it('cycle by day', async () => {
      db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              {
                type: 'integer',
                options: {
                  cycle: '0 0 0 * * *',
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create({
        id: 1,
        createdAt: yesterday,
      });
      expect(item1.get('name')).toBe('0');

      const item2 = await TestModel.create({
        id: 2,
        createdAt: yesterday,
      });
      expect(item2.get('name')).toBe('1');

      const item3 = await TestModel.create({ id: 3 });
      expect(item3.get('name')).toBe('0');

      const item4 = await TestModel.create({ id: 4 });
      expect(item4.get('name')).toBe('1');
    });

    it('last record has no value of this field', async () => {
      const testCollection = db.collection({
        name: 'tests',
        fields: [],
      });
      await db.sync();

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBeUndefined();

      testCollection.addField('name', {
        type: 'sequence',
        patterns: [
          {
            type: 'integer',
            options: { key: 1 },
          },
        ],
      });
      await db.sync();

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe('0');
    });

    it('deleted sequence should be skipped', async () => {
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

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe('0');

      await item1.destroy();

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe('1');
    });

    it('multiple integer in same field', async () => {
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
              {
                type: 'integer',
                options: { key: 2 },
              },
            ],
          },
        ],
      });
      await db.sync();

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe('00');

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe('11');
    });

    describe.skipIf(process.env['DB_DIALECT'] === 'sqlite')('bigint', () => {
      it('digits more than 16', async () => {
        db.collection({
          name: 'tests',
          fields: [
            {
              type: 'sequence',
              name: 'no',
              patterns: [
                {
                  type: 'integer',
                  options: { key: 1, digits: 17 },
                },
              ],
              inputable: true,
            },
          ],
        });
        await db.sync();

        const TestModel = db.getModel('tests');
        const item1 = await TestModel.create();
        expect(item1.get('no')).toBe('00000000000000000');

        await item1.update({ no: '10000000000000000' });
        expect(item1.get('no')).toBe('10000000000000000');

        const item2 = await TestModel.create({ no: '10000000000000001' });
        expect(item2.get('no')).toBe('10000000000000001');

        const item3 = await TestModel.create();
        expect(item3.get('no')).toBe('10000000000000002');
      });
    });
  });

  describe('date pattern', () => {
    it('default to current createdAt as YYYYMMDD', async () => {
      db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [{ type: 'date' }],
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const YYYYMMDD = dayjs(now).format('YYYYMMDD');

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe(YYYYMMDD);
    });

    it('field option', async () => {
      db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [{ type: 'date', options: { field: 'date' } }],
          },
          {
            type: 'date',
            name: 'date',
          },
        ],
      });
      await db.sync();

      const date = new Date(2022, 7, 1);
      const YYYYMMDD = dayjs(date).format('YYYYMMDD');

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create({
        date,
      });
      expect(item1.get('name')).toBe(YYYYMMDD);
    });

    it('format option', async () => {
      db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [{ type: 'date', options: { format: 'YYYY-MM-DD' } }],
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const YYYYMMDD = dayjs(now).format('YYYY-MM-DD');

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe(YYYYMMDD);
    });
  });

  describe('mixed pattern', () => {
    it('all patterns', async () => {
      db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              { type: 'string', options: { value: 'A' } },
              { type: 'date' },
              { type: 'integer', options: { key: 1 } },
            ],
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const YYYYMMDD = dayjs(now).format('YYYYMMDD');

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe(`A${YYYYMMDD}0`);

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe(`A${YYYYMMDD}1`);
    });

    it('changed after generated', async () => {
      const testsCollection = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              { type: 'string', options: { value: 'A' } },
              { type: 'date' },
              { type: 'integer', options: { key: 1 } },
            ],
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const YYYYMMDD = dayjs(now).format('YYYYMMDD');

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.get('name')).toBe(`A${YYYYMMDD}0`);

      const f2 = testsCollection.setField('name', {
        type: 'sequence',
        patterns: [
          { type: 'string', options: { value: 'A' } },
          { type: 'date' },
          // change options but no difference with default with new key
          { type: 'integer', options: { digits: 1, key: 2 } },
        ],
      }) as SequenceField;

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe(`A${YYYYMMDD}0`);

      const f3 = testsCollection.setField('name', {
        type: 'sequence',
        patterns: [
          { type: 'string', options: { value: 'A' } },
          { type: 'date' },
          // change options but no difference with default with key
          { type: 'integer', options: { digits: 1, key: f2.options.patterns[2].options.key } },
        ],
      });

      const item3 = await TestModel.create();
      expect(item3.get('name')).toBe(`A${YYYYMMDD}1`);

      const f4 = testsCollection.setField('name', {
        type: 'sequence',
        patterns: [
          { type: 'string', options: { value: 'A' } },
          { type: 'date' },
          { type: 'integer', options: { digits: 2, key: 3 } },
        ],
      });

      const item4 = await TestModel.create();
      expect(item4.get('name')).toBe(`A${YYYYMMDD}00`);

      testsCollection.setField('name', {
        type: 'sequence',
        patterns: [
          { type: 'string', options: { value: 'a' } },
          { type: 'date' },
          { type: 'integer', options: { digits: 2, key: f4.options.patterns[2].options.key } },
        ],
      });

      const item5 = await TestModel.create();
      expect(item5.get('name')).toBe(`a${YYYYMMDD}01`);

      testsCollection.setField('name', {
        type: 'sequence',
        patterns: [{ type: 'date' }, { type: 'integer', options: { digits: 2, key: 4 } }],
      });

      const item6 = await TestModel.create();
      expect(item6.get('name')).toBe(`${YYYYMMDD}00`);
    });
  });

  describe('multiple serial fields', () => {
    it('2 fields', async () => {
      const testsCollection = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              { type: 'string', options: { value: 'A' } },
              { type: 'date' },
              { type: 'integer', options: { digits: 2, cycle: '0 0 * * *', key: 1 } },
            ],
          },
          {
            type: 'sequence',
            name: 'code',
            patterns: [
              { type: 'string', options: { value: 'C' } },
              { type: 'integer', options: { digits: 4, key: 1 } },
            ],
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const NOW = dayjs(now).format('YYYYMMDD');
      const YESTERDAY = dayjs(yesterday).format('YYYYMMDD');

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create({ createdAt: yesterday });
      expect(item1.get('name')).toBe(`A${YESTERDAY}00`);
      expect(item1.get('code')).toBe(`C0000`);

      const item2 = await TestModel.create();
      expect(item2.get('name')).toBe(`A${NOW}00`);
      expect(item2.get('code')).toBe(`C0001`);

      testsCollection.setField('name', {
        type: 'sequence',
        patterns: [
          { type: 'date' },
          { type: 'integer', options: { digits: 1, key: 1 } },
          { type: 'string', options: { value: 'a' } },
        ],
      });

      const item3 = await TestModel.create();
      expect(item3.get('name')).toBe(`${NOW}1a`);
      expect(item3.get('code')).toBe(`C0002`);
    });
  });

  describe('inputable', () => {
    it('not inputable', async () => {
      const testsCollection = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              { type: 'string', options: { value: 'A' } },
              { type: 'date' },
              { type: 'integer', options: { key: 1 } },
            ],
            inputable: false,
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const YYYYMMDD = dayjs(now).format('YYYYMMDD');
      const name = `BB${YYYYMMDD}11`;

      const TestModel = db.getModel('tests');
      const result = await TestModel.create({ name });
      expect(result.name).toBe(`A${YYYYMMDD}0`);
    });

    it('inputable without match', async () => {
      const testsCollection = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              { type: 'string', options: { value: 'A' } },
              { type: 'date' },
              { type: 'integer', options: { key: 1 } },
            ],
            inputable: true,
            match: false,
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const YYYYMMDD = dayjs(now).format('YYYYMMDD');
      const name = `BB${YYYYMMDD}11`;

      const TestModel = db.getModel('tests');
      const result = await TestModel.create({ name });
      expect(result.name).toBe(name);
    });

    it('inputable with match', async () => {
      const testsCollection = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              { type: 'string', options: { value: 'A' } },
              { type: 'date' },
              { type: 'integer', options: { key: 1 } },
            ],
            inputable: true,
            match: true,
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const YYYYMMDD = dayjs(now).format('YYYYMMDD');

      const TestModel = db.getModel('tests');
      await expect(TestModel.create({ name: `BB${YYYYMMDD}11` })).rejects.toThrow();
    });

    it('input value within generated sequence', async () => {
      const testsCollection = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [{ type: 'integer', options: { key: 1 } }],
            inputable: true,
            match: true,
          },
        ],
      });
      await db.sync();

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create();
      expect(item1.name).toBe('0');

      const item2 = await TestModel.create({ name: '0' });
      expect(item2.name).toBe('0');

      const item3 = await TestModel.create();
      expect(item3.name).toBe('1');
    });

    it('input value beyond generated sequence', async () => {
      const testsCollection = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [{ type: 'integer', options: { key: 1 } }],
            inputable: true,
            match: true,
          },
        ],
      });
      await db.sync();

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create({});
      expect(item1.name).toBe('0');

      const item2 = await TestModel.create({ name: '2' });
      expect(item2.name).toBe('2');

      const item3 = await TestModel.create({});
      expect(item3.name).toBe('3');
    });

    it('input value with cycle', async () => {
      const testsCollection = db.collection({
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [{ type: 'integer', options: { key: 1, cycle: '0 0 0 * * *' } }],
            inputable: true,
            match: true,
          },
        ],
      });
      await db.sync();

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const TestModel = db.getModel('tests');
      const item1 = await TestModel.create({ createdAt: yesterday });
      expect(item1.name).toBe('0');

      const item2 = await TestModel.create({ name: '0', createdAt: yesterday });
      expect(item2.name).toBe('0');

      const item3 = await TestModel.create({ createdAt: yesterday });
      expect(item3.name).toBe('1');

      const item4 = await TestModel.create();
      expect(item4.name).toBe('0');
    });
  });

  describe('associations', () => {
    it('sequence field in m2m through table', async () => {
      const postsTagsCollection = db.collection({
        name: 'posts_tags',
        fields: [
          {
            type: 'sequence',
            name: 'seq',
            patterns: [{ type: 'date' }, { type: 'integer', options: { key: 1 } }],
          },
        ],
      });
      const postsCollection = db.collection({
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'belongsToMany',
            name: 'tags',
            through: 'posts_tags',
          },
        ],
      });
      const tagsCollection = db.collection({
        name: 'tags',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'belongsToMany',
            name: 'posts',
            through: 'posts_tags',
          },
        ],
      });

      await db.sync();

      const now = new Date();
      const dateStr = dayjs(now).format('YYYYMMDD');

      const tagsRepo = db.getRepository('tags');
      const tags = await tagsRepo.create({
        values: [{ title: 't1' }, { title: 't2' }, { title: 't3' }],
      });
      const postsTagsRepo = db.getRepository('posts_tags');
      const postTag = await postsTagsRepo.create({
        values: {
          postId: 1,
          tagId: 1,
        },
      });

      const postsRepo = db.getRepository('posts');
      await postsRepo.create({
        values: {
          title: 'p1',
          tags,
        },
      });

      const postsTags = await postsTagsRepo.find({
        order: [['seq', 'ASC']],
      });

      expect(postsTags[0].seq).toBe(`${dateStr}0`);
      expect(postsTags[1].seq).toBe(`${dateStr}1`);
      expect(postsTags[2].seq).toBe(`${dateStr}2`);
    });
  });
});
