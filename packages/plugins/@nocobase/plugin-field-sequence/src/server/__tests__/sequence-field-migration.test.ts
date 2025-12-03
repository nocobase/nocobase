/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, FieldOptions } from '@nocobase/database';
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
