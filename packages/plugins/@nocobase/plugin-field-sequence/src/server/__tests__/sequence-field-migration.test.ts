/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, FieldOptions, Model } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

describe('Should update sequence collection`s current base on business collections', () => {
  let app: MockServer;
  let db: Database;

  const presetField: FieldOptions[] = [
    {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      interface: 'integer',
      type: 'bigInt',
      name: 'id',
    },
    {
      field: 'createdAt',
      interface: 'createdAt',
      type: 'date',
      name: 'createdAt',
    },
    {
      field: 'updatedAt',
      interface: 'updatedAt',
      type: 'date',
      name: 'updatedAt',
    },
  ];

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-sequence'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  describe('Integer only pattern sequences', () => {
    it('Single integer without cycle in sequences field', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            patterns: [
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: null,
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      for (let i = 0; i < 5; i++) {
        await testModel.create();
      }

      const sequencesRepository = db.getRepository('sequences');

      let sequences = await sequencesRepository.findOne({
        filter: {
          collection: 'tests',
          field: 'sequence',
          key: 1,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(5);

      await sequencesRepository.update({
        filterByTk: sequences.id,
        values: {
          current: 0,
        },
      });
      sequences = await sequencesRepository.findOne({
        filter: {
          id: sequences.id,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(0);

      await app.runCommand('repair');

      sequences = await sequencesRepository.findOne({
        filter: {
          id: sequences.id,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(5);
    });

    it('Should repair to the maximum sequence when records created at the same time are out of sequence order', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            inputable: true,
            patterns: [
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: null,
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const records: Model[] = [];
      for (const sequence of ['0001', '0003', '0002']) {
        records.push(
          await testModel.create({
            sequence,
            createdAt,
          }),
        );
      }

      const sequencesRepository = db.getRepository('sequences');
      const sequences = await sequencesRepository.findOne({
        filter: {
          collection: 'tests',
          field: 'sequence',
          key: 1,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(3);

      await sequencesRepository.update({
        filterByTk: sequences.id,
        values: {
          current: 0,
        },
      });

      await app.runCommand('repair');

      records.push(await testModel.create());
      const values = records.map((record) => record.get('sequence'));
      expect(values).toEqual(['0001', '0003', '0002', '0004']);
      expect(new Set(values).size).toBe(values.length);
    });

    it('Should use createdAt instead of a string primary key to locate the latest batch', async () => {
      db.collection({
        name: 'tests',
        fields: [
          {
            type: 'string',
            name: 'id',
            primaryKey: true,
          },
          ...presetField.slice(1),
          {
            type: 'sequence',
            name: 'sequence',
            inputable: true,
            patterns: [
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: null,
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      const previousSecond = new Date('2026-01-01T00:00:00.900Z');
      const latestSecond = new Date('2026-01-01T00:00:01.100Z');
      const records = [
        { id: 'z', sequence: '0001', createdAt: previousSecond },
        { id: 'a', sequence: '0002', createdAt: latestSecond },
        { id: 'b', sequence: '0004', createdAt: latestSecond },
        { id: 'c', sequence: '0003', createdAt: latestSecond },
      ];
      for (const values of records) {
        await testModel.create(values);
      }

      const sequencesRepository = db.getRepository('sequences');
      const sequences = await sequencesRepository.findOne({
        filter: {
          collection: 'tests',
          field: 'sequence',
          key: 1,
        },
      });
      await sequencesRepository.update({
        filterByTk: sequences.id,
        values: {
          current: 0,
        },
      });

      await app.runCommand('repair');

      const record = await testModel.create({ id: 'next', createdAt: latestSecond });
      expect(record.get('sequence')).toBe('0005');
    });

    it('Should repair when the sequence field is also the primary key', async () => {
      db.collection({
        name: 'tests',
        autoGenId: false,
        fields: [
          ...presetField.slice(1),
          {
            type: 'sequence',
            name: 'sequence',
            primaryKey: true,
            inputable: true,
            patterns: [
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: null,
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      for (const sequence of ['0001', '0003', '0002']) {
        await testModel.create({ sequence, createdAt });
      }

      const sequencesRepository = db.getRepository('sequences');
      const sequences = await sequencesRepository.findOne({
        filter: {
          collection: 'tests',
          field: 'sequence',
          key: 1,
        },
      });
      await sequencesRepository.update({
        filterByTk: sequences.id,
        values: {
          current: 0,
        },
      });

      await app.runCommand('repair');

      const repairedSequence = await sequencesRepository.findOne({ filterByTk: sequences.id });
      expect(repairedSequence.current).toBe(3);

      const record = await testModel.create({ createdAt });
      expect(record.get('sequence')).toBe('0004');
    });

    it('Single integer with cycle in sequences field', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            patterns: [
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: '0 0 * * *',
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      for (let i = 0; i < 5; i++) {
        await testModel.create();
      }

      const sequencesRepository = db.getRepository('sequences');

      let sequences = await sequencesRepository.findOne({
        filter: {
          collection: 'tests',
          field: 'sequence',
          key: 1,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(5);

      await sequencesRepository.update({
        filterByTk: sequences.id,
        values: {
          current: 0,
        },
      });
      sequences = await sequencesRepository.findOne({
        filter: {
          id: sequences.id,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(0);

      await app.runCommand('repair');

      sequences = await sequencesRepository.findOne({
        filter: {
          id: sequences.id,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(5);

      const [record] = await testModel.findAll({
        order: [['id', 'DESC']],
        limit: 1,
      });
      expect(sequences['lastGeneratedAt']).toStrictEqual(record['createdAt']);
    });

    it('Multiple integer without cycle in sequences field', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            patterns: [
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: null,
                  key: 1,
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 5,
                  start: 10,
                  cycle: null,
                  key: 2,
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 6,
                  start: 100,
                  cycle: null,
                  key: 3,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      for (let i = 0; i < 5; i++) {
        await testModel.create();
      }

      const sequencesRepository = db.getRepository('sequences');

      const keys = [1, 2, 3];
      const startMap = {
        1: 1,
        2: 10,
        3: 100,
      };
      for (const key of keys) {
        let sequences = await sequencesRepository.findOne({
          filter: {
            collection: 'tests',
            field: 'sequence',
            key,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(startMap[key] + 4);

        await sequencesRepository.update({
          filterByTk: sequences.id,
          values: {
            current: 0,
          },
        });
        sequences = await sequencesRepository.findOne({
          filter: {
            id: sequences.id,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(0);

        await app.runCommand('repair');

        sequences = await sequencesRepository.findOne({
          filter: {
            id: sequences.id,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(startMap[key] + 4);
      }
    });

    it('Multiple integer with cycle in sequences field', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            patterns: [
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: null,
                  key: 1,
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 5,
                  start: 10,
                  cycle: null,
                  key: 2,
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 6,
                  start: 100,
                  cycle: null,
                  key: 3,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      for (let i = 0; i < 5; i++) {
        await testModel.create();
      }

      const sequencesRepository = db.getRepository('sequences');

      const keys = [1, 2, 3];
      const startMap = {
        1: 1,
        2: 10,
        3: 100,
      };
      for (const key of keys) {
        let sequences = await sequencesRepository.findOne({
          filter: {
            collection: 'tests',
            field: 'sequence',
            key,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(startMap[key] + 4);

        await sequencesRepository.update({
          filterByTk: sequences.id,
          values: {
            current: 0,
          },
        });
        sequences = await sequencesRepository.findOne({
          filter: {
            id: sequences.id,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(0);

        await app.runCommand('repair');

        sequences = await sequencesRepository.findOne({
          filter: {
            id: sequences.id,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(startMap[key] + 4);

        const [record] = await testModel.findAll({
          order: [['id', 'DESC']],
          limit: 1,
        });
        expect(sequences['lastGeneratedAt']).toStrictEqual(record['createdAt']);
      }
    });
  });

  describe('Date pattern with daily cycle', () => {
    beforeEach(async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            inputable: true,
            patterns: [
              {
                type: 'date',
                options: {
                  format: 'YYYYMMDD',
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: '0 0 * * *',
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();
    });

    it('Should repair from the restarted counter on the next day', async () => {
      const testModel = db.getModel('tests');
      const firstDay = new Date('2026-01-01T00:00:00.000Z');
      const secondDay = new Date('2026-01-02T00:00:00.000Z');
      const existingRecords = [
        { sequence: '202601010001', createdAt: firstDay },
        { sequence: '202601010002', createdAt: firstDay },
        { sequence: '202601010003', createdAt: firstDay },
        { sequence: '202601020001', createdAt: secondDay },
      ];
      for (const values of existingRecords) {
        await testModel.create(values);
      }

      const sequencesRepository = db.getRepository('sequences');
      const sequences = await sequencesRepository.findOne({
        filter: {
          collection: 'tests',
          field: 'sequence',
          key: 1,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(1);

      await sequencesRepository.update({
        filterByTk: sequences.id,
        values: {
          current: 0,
        },
      });

      await app.runCommand('repair');

      const record = await testModel.create({ createdAt: secondDay });
      expect(record.get('sequence')).toBe('202601020002');
    });

    it('Should repair to the maximum sequence in the latest daily cycle when records are out of order', async () => {
      const testModel = db.getModel('tests');
      const firstDay = new Date('2026-01-01T00:00:00.000Z');
      const secondDay = new Date('2026-01-02T00:00:00.000Z');
      const existingRecords = [
        { sequence: '202601010001', createdAt: firstDay },
        { sequence: '202601010002', createdAt: firstDay },
        { sequence: '202601010003', createdAt: firstDay },
        { sequence: '202601020001', createdAt: secondDay },
        { sequence: '202601020003', createdAt: secondDay },
        { sequence: '202601020002', createdAt: secondDay },
      ];
      for (const values of existingRecords) {
        await testModel.create(values);
      }

      const sequencesRepository = db.getRepository('sequences');
      const sequences = await sequencesRepository.findOne({
        filter: {
          collection: 'tests',
          field: 'sequence',
          key: 1,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(3);

      await sequencesRepository.update({
        filterByTk: sequences.id,
        values: {
          current: 0,
        },
      });

      await app.runCommand('repair');

      await testModel.create({ createdAt: secondDay });
      const records = await testModel.findAll({ order: [['id', 'ASC']] });
      const values = records.map((record) => record.get('sequence'));
      expect(values).toEqual([
        '202601010001',
        '202601010002',
        '202601010003',
        '202601020001',
        '202601020003',
        '202601020002',
        '202601020004',
      ]);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe('Complex patterns sequences', () => {
    it('Single integer without cycle in sequences field', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            patterns: [
              {
                type: 'string',
                options: {
                  value: 'RF',
                },
              },
              {
                type: 'date',
                options: {
                  format: 'YYYYMMDD',
                },
              },
              {
                type: 'randomChar',
                options: {
                  length: 6,
                  charsets: ['uppercase'],
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: null,
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      for (let i = 0; i < 5; i++) {
        await testModel.create();
      }

      const sequencesRepository = db.getRepository('sequences');

      let sequences = await sequencesRepository.findOne({
        filter: {
          collection: 'tests',
          field: 'sequence',
          key: 1,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(5);

      await sequencesRepository.update({
        filterByTk: sequences.id,
        values: {
          current: 0,
        },
      });
      sequences = await sequencesRepository.findOne({
        filter: {
          id: sequences.id,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(0);

      await app.runCommand('repair');

      sequences = await sequencesRepository.findOne({
        filter: {
          id: sequences.id,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(5);
    });

    it('Single integer with cycle in sequences field', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            patterns: [
              {
                type: 'string',
                options: {
                  value: 'RF',
                },
              },
              {
                type: 'date',
                options: {
                  format: 'YYYYMMDD',
                },
              },
              {
                type: 'randomChar',
                options: {
                  length: 6,
                  charsets: ['uppercase'],
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: '0 0 * * *',
                  key: 1,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      for (let i = 0; i < 5; i++) {
        await testModel.create();
      }

      const sequencesRepository = db.getRepository('sequences');

      let sequences = await sequencesRepository.findOne({
        filter: {
          collection: 'tests',
          field: 'sequence',
          key: 1,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(5);

      await sequencesRepository.update({
        filterByTk: sequences.id,
        values: {
          current: 0,
        },
      });
      sequences = await sequencesRepository.findOne({
        filter: {
          id: sequences.id,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(0);

      await app.runCommand('repair');

      sequences = await sequencesRepository.findOne({
        filter: {
          id: sequences.id,
        },
      });
      expect(sequences).toBeDefined();
      expect(sequences.current).toBe(5);

      const [record] = await testModel.findAll({
        order: [['id', 'DESC']],
        limit: 1,
      });
      expect(sequences['lastGeneratedAt']).toStrictEqual(record['createdAt']);
    });

    it('Multiple integer without cycle in sequences field', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            patterns: [
              {
                type: 'string',
                options: {
                  value: 'RF',
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: null,
                  key: 1,
                },
              },
              {
                type: 'date',
                options: {
                  format: 'YYYYMMDD',
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 5,
                  start: 10,
                  cycle: null,
                  key: 2,
                },
              },
              {
                type: 'randomChar',
                options: {
                  length: 6,
                  charsets: ['uppercase'],
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 6,
                  start: 100,
                  cycle: null,
                  key: 3,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      for (let i = 0; i < 5; i++) {
        await testModel.create();
      }

      const sequencesRepository = db.getRepository('sequences');

      const keys = [1, 2, 3];
      const startMap = {
        1: 1,
        2: 10,
        3: 100,
      };
      for (const key of keys) {
        let sequences = await sequencesRepository.findOne({
          filter: {
            collection: 'tests',
            field: 'sequence',
            key,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(startMap[key] + 4);

        await sequencesRepository.update({
          filterByTk: sequences.id,
          values: {
            current: 0,
          },
        });
        sequences = await sequencesRepository.findOne({
          filter: {
            id: sequences.id,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(0);

        await app.runCommand('repair');

        sequences = await sequencesRepository.findOne({
          filter: {
            id: sequences.id,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(startMap[key] + 4);
      }
    });

    it('Multiple integer with cycle in sequences field', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence',
            patterns: [
              {
                type: 'string',
                options: {
                  value: 'RF',
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: '0 0 * * *',
                  key: 1,
                },
              },
              {
                type: 'date',
                options: {
                  format: 'YYYYMMDD',
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 5,
                  start: 10,
                  cycle: '0 0 * * *',
                  key: 2,
                },
              },
              {
                type: 'randomChar',
                options: {
                  length: 6,
                  charsets: ['uppercase'],
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 6,
                  start: 100,
                  cycle: '0 0 * * *',
                  key: 3,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      for (let i = 0; i < 5; i++) {
        await testModel.create();
      }

      const sequencesRepository = db.getRepository('sequences');

      const keys = [1, 2, 3];
      const startMap = {
        1: 1,
        2: 10,
        3: 100,
      };
      for (const key of keys) {
        let sequences = await sequencesRepository.findOne({
          filter: {
            collection: 'tests',
            field: 'sequence',
            key,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(startMap[key] + 4);

        await sequencesRepository.update({
          filterByTk: sequences.id,
          values: {
            current: 0,
          },
        });
        sequences = await sequencesRepository.findOne({
          filter: {
            id: sequences.id,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(0);

        await app.runCommand('repair');

        sequences = await sequencesRepository.findOne({
          filter: {
            id: sequences.id,
          },
        });
        expect(sequences).toBeDefined();
        expect(sequences.current).toBe(startMap[key] + 4);

        const [record] = await testModel.findAll({
          order: [['id', 'DESC']],
          limit: 1,
        });
        expect(sequences['lastGeneratedAt']).toStrictEqual(record['createdAt']);
      }
    });

    it('Multiple sequences field in one collection', async () => {
      db.collection({
        name: 'tests',
        fields: [
          ...presetField,
          {
            type: 'sequence',
            name: 'sequence1',
            patterns: [
              {
                type: 'string',
                options: {
                  value: 'RF',
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: '0 0 * * *',
                  key: 1,
                },
              },
              {
                type: 'date',
                options: {
                  format: 'YYYYMMDD',
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 5,
                  start: 10,
                  cycle: '0 0 * * *',
                  key: 2,
                },
              },
              {
                type: 'randomChar',
                options: {
                  length: 6,
                  charsets: ['uppercase'],
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 6,
                  start: 100,
                  cycle: '0 0 * * *',
                  key: 3,
                },
              },
            ],
          },
          {
            type: 'sequence',
            name: 'sequence2',
            patterns: [
              {
                type: 'string',
                options: {
                  value: 'RF',
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 4,
                  start: 1,
                  cycle: '0 0 * * *',
                  key: 1,
                },
              },
              {
                type: 'date',
                options: {
                  format: 'YYYYMMDD',
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 5,
                  start: 10,
                  cycle: '0 0 * * *',
                  key: 2,
                },
              },
              {
                type: 'randomChar',
                options: {
                  length: 6,
                  charsets: ['uppercase'],
                },
              },
              {
                type: 'integer',
                options: {
                  digits: 6,
                  start: 100,
                  cycle: '0 0 * * *',
                  key: 3,
                },
              },
            ],
          },
        ],
      });
      await db.sync();

      const testModel = db.getModel('tests');
      for (let i = 0; i < 5; i++) {
        await testModel.create();
      }

      const sequencesRepository = db.getRepository('sequences');

      const sequencesFields = ['sequence1', 'sequence2'];
      const keys = [1, 2, 3];
      const startMap = {
        1: 1,
        2: 10,
        3: 100,
      };
      for (const field of sequencesFields) {
        for (const key of keys) {
          let sequences = await sequencesRepository.findOne({
            filter: {
              collection: 'tests',
              field,
              key,
            },
          });
          expect(sequences).toBeDefined();
          expect(sequences.current).toBe(startMap[key] + 4);

          await sequencesRepository.update({
            filterByTk: sequences.id,
            values: {
              current: 0,
            },
          });
          sequences = await sequencesRepository.findOne({
            filter: {
              id: sequences.id,
            },
          });
          expect(sequences).toBeDefined();
          expect(sequences.current).toBe(0);

          await app.runCommand('repair');

          sequences = await sequencesRepository.findOne({
            filter: {
              id: sequences.id,
            },
          });
          expect(sequences).toBeDefined();
          expect(sequences.current).toBe(startMap[key] + 4);

          const [record] = await testModel.findAll({
            order: [['id', 'DESC']],
            limit: 1,
          });
          expect(sequences['lastGeneratedAt']).toStrictEqual(record['createdAt']);
        }
      }
    });

    it('Multiple collection with sequences field', async () => {
      const sequencesFieldDefinition = [
        {
          type: 'sequence',
          name: 'sequence1',
          patterns: [
            {
              type: 'string',
              options: {
                value: 'RF',
              },
            },
            {
              type: 'integer',
              options: {
                digits: 4,
                start: 1,
                cycle: '0 0 * * *',
                key: 1,
              },
            },
            {
              type: 'date',
              options: {
                format: 'YYYYMMDD',
              },
            },
            {
              type: 'integer',
              options: {
                digits: 5,
                start: 10,
                cycle: '0 0 * * *',
                key: 2,
              },
            },
            {
              type: 'randomChar',
              options: {
                length: 6,
                charsets: ['uppercase'],
              },
            },
            {
              type: 'integer',
              options: {
                digits: 6,
                start: 100,
                cycle: '0 0 * * *',
                key: 3,
              },
            },
          ],
        },
        {
          type: 'sequence',
          name: 'sequence2',
          patterns: [
            {
              type: 'string',
              options: {
                value: 'RF',
              },
            },
            {
              type: 'integer',
              options: {
                digits: 4,
                start: 1,
                cycle: '0 0 * * *',
                key: 1,
              },
            },
            {
              type: 'date',
              options: {
                format: 'YYYYMMDD',
              },
            },
            {
              type: 'integer',
              options: {
                digits: 5,
                start: 10,
                cycle: '0 0 * * *',
                key: 2,
              },
            },
            {
              type: 'randomChar',
              options: {
                length: 6,
                charsets: ['uppercase'],
              },
            },
            {
              type: 'integer',
              options: {
                digits: 6,
                start: 100,
                cycle: '0 0 * * *',
                key: 3,
              },
            },
          ],
        },
      ];
      db.collection({
        name: 'tests1',
        fields: [...presetField, ...sequencesFieldDefinition],
      });
      db.collection({
        name: 'tests2',
        fields: [...presetField, ...sequencesFieldDefinition],
      });
      await db.sync();

      const sequencesRepository = db.getRepository('sequences');

      const collections = ['tests1', 'tests2'];
      const sequencesFields = ['sequence1', 'sequence2'];
      const keys = [1, 2, 3];
      const startMap = {
        1: 1,
        2: 10,
        3: 100,
      };
      for (const collection of collections) {
        const testModel = db.getModel(collection);
        for (let i = 0; i < 5; i++) {
          await testModel.create();
        }
        for (const field of sequencesFields) {
          for (const key of keys) {
            let sequences = await sequencesRepository.findOne({
              filter: {
                collection,
                field,
                key,
              },
            });
            expect(sequences).toBeDefined();
            expect(sequences.current).toBe(startMap[key] + 4);

            await sequencesRepository.update({
              filterByTk: sequences.id,
              values: {
                current: 0,
              },
            });
            sequences = await sequencesRepository.findOne({
              filter: {
                id: sequences.id,
              },
            });
            expect(sequences).toBeDefined();
            expect(sequences.current).toBe(0);

            await app.runCommand('repair');

            sequences = await sequencesRepository.findOne({
              filter: {
                id: sequences.id,
              },
            });
            expect(sequences).toBeDefined();
            expect(sequences.current).toBe(startMap[key] + 4);

            const [record] = await testModel.findAll({
              order: [['id', 'DESC']],
              limit: 1,
            });
            expect(sequences['lastGeneratedAt']).toStrictEqual(record['createdAt']);
          }
        }
      }
    });
  });
});
