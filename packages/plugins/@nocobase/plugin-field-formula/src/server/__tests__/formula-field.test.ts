/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';
import { FormulaField } from '../formula-field';

describe('formula field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    db.registerFieldTypes({
      formula: FormulaField,
    });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('engines', () => {
    describe('math.js', () => {
      it('auto set formula field with create or update data', async () => {
        const expression = '{{price}}*{{count}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'float', name: 'price' },
            { type: 'float', name: 'count' },
            { name: 'sum', type: 'formula', expression, engine: 'math.js' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          price: '1.2',
          count: '2',
        });

        const sumField = Test.getField('sum');
        expect(test.get('sum')).toEqual(2.4);

        test.set('count', '6');
        await test.save();
        expect(test.get('sum')).toEqual(7.2);
      });

      it('auto set formula field with create or update data', async () => {
        const expression = '{{price}}*{{count}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'float', name: 'price' },
            { type: 'float', name: 'count' },
            { name: 'sum', type: 'formula', expression, engine: 'math.js' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          price: '1.2',
          count: '2',
        });

        const sumField = Test.getField('sum');
        expect(test.get('sum')).toEqual(2.4);

        test.set('count', '6');
        await test.save();
        expect(test.get('sum')).toEqual(7.2);
      });

      it('1.22+2=3.22', async () => {
        const expression = '{{a}}+{{b}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'float', name: 'a' },
            { type: 'float', name: 'b' },
            { name: 'sum', type: 'formula', expression, engine: 'math.js' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: '2',
          b: '1.22',
        });

        expect(test.get('sum')).toEqual(3.22);
      });

      it('scope with number key', async () => {
        const expression = '{{a.1}}+1';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'json', name: 'a' },
            { name: 'sum', type: 'formula', expression, engine: 'math.js' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: { '1': 1 },
        });

        expect(test.get('sum')).toEqual(2);
      });
    });

    describe('formula.js', () => {
      it('SUM(a, b)', async () => {
        const expression = 'SUM({{a}}, {{b}})';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'float', name: 'a' },
            { type: 'float', name: 'b' },
            { name: 'sum', type: 'formula', expression, engine: 'formula.js' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: 2,
          b: 1.22,
        });

        expect(test.get('sum')).toEqual(3.22);
      });
    });
  });

  describe('data types', () => {
    describe('boolean', () => {
      it('from null', async () => {
        const expression = '{{a}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'boolean', name: 'a' },
            { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'boolean' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: null,
        });

        expect(test.get('formula')).toBe(null);
      });

      it('from boolean', async () => {
        const expression = '{{a}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'boolean', name: 'a' },
            { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'boolean' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: true,
        });

        expect(test.get('formula')).toBe(true);
      });

      it('from number', async () => {
        const expression = '{{a}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'double', name: 'a' },
            { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'boolean' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: 123.45,
        });

        expect(test.get('formula')).toBe(true);
      });

      it('from bigint', async () => {
        const expression = '{{a}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'bigInt', name: 'a' },
            { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'boolean' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: BigInt(123),
        });

        expect(test.get('formula')).toBe(true);
      });

      it('from empty string', async () => {
        const expression = '{{a}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'string', name: 'a' },
            { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'boolean' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: '',
        });

        expect(test.get('formula')).toBe(false);
      });

      it('from string', async () => {
        const expression = '{{a}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'string', name: 'a' },
            { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'boolean' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: ' ',
        });

        expect(test.get('formula')).toBe(true);
      });

      it('from date', async () => {
        const expression = '{{a}}';
        const Test = db.collection({
          name: 'tests',
          fields: [
            { type: 'date', name: 'a' },
            { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'boolean' },
          ],
        });

        await db.sync();

        const test = await Test.model.create<any>({
          a: new Date(),
        });

        expect(test.get('formula')).toBe(true);
      });
    });

    describe('to integer', () => {
      describe('from boolean', () => {
        it('null', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: null,
          });

          expect(test.get('formula')).toBe(null);
        });

        it('true', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: true,
          });

          expect(test.get('formula')).toBe(1);
        });

        it('false', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: false,
          });

          expect(test.get('formula')).toBe(0);
        });
      });

      describe('from number', () => {
        it('positive', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'float', name: 'a' },
              { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 34.56,
          });

          expect(test.get('formula')).toBe(34);
        });

        it('negative', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'float', name: 'a' },
              { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: -34.56,
          });

          expect(test.get('formula')).toBe(-34);
        });
      });

      describe('from bigint', () => {
        it('in int range', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'bigInt', name: 'a' },
              { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: BigInt(123),
          });

          expect(test.get('formula')).toBe(123);
        });

        it('out of int range', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'bigInt', name: 'a' },
              { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          Test.model
            .create<any>({ a: BigInt(Number.MAX_SAFE_INTEGER) })
            .then(() => {
              throw Error('should not be called');
            })
            .catch((e) => {
              expect(e).toBeDefined();
            });
        });
      });

      describe('from string', () => {
        it('non-number content string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'formula', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 'abc',
          });

          expect(test.get('formula')).toBeNull();
        });

        it('number content in string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'integer', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: '123.6',
          });

          expect(test.get('integer')).toBe(123);
        });

        it('number started mixed content in string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'integer', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: '123abc',
          });

          expect(test.get('integer')).toBe(123);
        });
      });

      describe('from date', () => {
        it('now', async () => {
          const now = new Date();
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'date', name: 'a' },
              { name: 'integer', type: 'formula', expression, engine: 'formula.js', dataType: 'integer' },
            ],
          });

          await db.sync();

          Test.model
            .create<any>({ a: now })
            .then(() => {
              throw Error('should not be called');
            })
            .catch((e) => {
              expect(e).toBeDefined();
            });
        });
      });
    });

    describe('bigInt', () => {
      describe('from boolean', () => {
        it('true', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'bigInt' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: true,
          });
          expect(test.get('result')).toBe(1);
        });

        it('false', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'bigInt' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: false,
          });
          expect(test.get('result')).toBe(0);
        });
      });

      describe('from number', () => {
        it('float', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'float', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'bigInt' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 1.6,
          });
          expect(test.get('result')).toEqual(1);
        });

        it('negative', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'float', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'bigInt' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: -1.6,
          });
          expect(test.get('result')).toEqual(-1);
        });
      });

      describe('from string', () => {
        it('number string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'bigInt' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: '-123.56',
          });
          expect(test.get('result')).toEqual(-123);
        });

        it('mixed string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'bigInt' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: '9007199254740991abc',
          });
          expect(test.get('result')).toEqual(9007199254740991);
        });

        it('invalid number string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'bigInt' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 'abc',
          });
          expect(test.get('result')).toEqual(null);
        });

        it('infinity string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'bigInt' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 'Infinity',
          });
          expect(test.get('result')).toEqual(null);
        });
      });

      describe('from date', () => {
        it('now', async () => {
          const now = new Date();
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'date', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'bigInt' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: now,
          });
          expect(test.get('result')).toEqual(now.valueOf());
        });
      });
    });

    describe('double', () => {
      describe('from boolean', () => {
        it('true', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: true,
          });
          expect(test.get('result')).toEqual(1);
        });

        it('false', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: false,
          });
          expect(test.get('result')).toEqual(0);
        });
      });

      describe('from number', () => {
        it('integer', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'integer', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 1,
          });
          expect(test.get('result')).toEqual(1);
        });

        it('float', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'float', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: -1.5,
          });
          expect(test.get('result')).toEqual(-1.5);
        });
      });

      describe('from string', () => {
        it('empty string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: '',
          });
          expect(test.get('result')).toEqual(null);
        });

        it('number content string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: '123.456',
          });
          expect(test.get('result')).toEqual(123.456);
        });

        it('number started string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: '123.abc',
          });
          expect(test.get('result')).toEqual(123);
        });

        it('just string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 'abc',
          });
          expect(test.get('result')).toEqual(null);
        });

        it('Infinity', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 'Infinity',
          });
          expect(test.get('result')).toEqual(null);
        });
      });

      describe('from date', () => {
        it('now', async () => {
          const now = new Date();
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'date', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'double' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: now,
          });
          expect(test.get('result')).toEqual(now.valueOf());
        });
      });
    });

    describe.skip('decimal', () => {});

    describe('string', () => {
      describe('from boolean', () => {
        it('true', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'string' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: true,
          });
          expect(test.get('result')).toBe('true');
        });

        it('false', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'string' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: false,
          });
          expect(test.get('result')).toBe('false');
        });
      });

      describe('from number', () => {
        it('zero', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'integer', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'string' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 0,
          });
          expect(test.get('result')).toBe('0');
        });

        it('positive', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'float', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'string' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 1.5,
          });
          expect(test.get('result')).toBe('1.5');
        });

        it('negative', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'float', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'string' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: -1.5,
          });
          expect(test.get('result')).toBe('-1.5');
        });
      });

      describe('from bigint', () => {
        it('bigint', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'bigInt', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'string' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: BigInt(Number.MAX_SAFE_INTEGER),
          });

          expect(test.get('result')).toBe(`${Number.MAX_SAFE_INTEGER}`);
        });
      });

      describe('from string', () => {
        it('empty string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'string' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: '',
          });
          expect(test.get('result')).toBe('');
        });
      });

      describe('from date', () => {
        it('now', async () => {
          const now = new Date();
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'date', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'string' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: now,
          });
          expect(test.get('result')).toBe(now.toISOString());
        });
      });
    });

    describe('date', () => {
      describe('from boolean', () => {
        it('true', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'boolean', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'date' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: true,
          });
          expect(test.get('result')).toBe(null);
        });
      });

      describe('from number', () => {
        it('zero', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'integer', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'date' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 0,
          });
          expect(test.get('result')).toEqual(new Date(0));
        });

        it('positive float', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'float', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'date' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 123.456,
          });
          expect(test.get('result')).toEqual(new Date(123.456));
        });

        it('negative float', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'float', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'date' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: -123.456,
          });
          expect(test.get('result')).toEqual(new Date(-123.456));
        });
      });

      describe('from bigint', () => {
        it('in range', async () => {
          const now = new Date();
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'bigInt', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'date' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: now.valueOf(),
          });
          expect(test.get('result')).toEqual(new Date(now));
        });

        it('out of range', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'bigInt', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'date' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: BigInt(Number.MAX_SAFE_INTEGER),
          });
          expect(test.get('result')).toBe(null);
        });
      });

      describe('from string', () => {
        it('valid date string', async () => {
          const now = new Date();
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'date' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: now.toISOString(),
          });
          expect(test.get('result')).toEqual(now);
        });

        it('invalid date string', async () => {
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'string', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'date' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: 'xxx',
          });
          expect(test.get('result')).toBe(null);
        });
      });

      describe('from date', () => {
        it('now', async () => {
          const now = new Date();
          const expression = '{{a}}';
          const Test = db.collection({
            name: 'tests',
            fields: [
              { type: 'date', name: 'a' },
              { name: 'result', type: 'formula', expression, engine: 'formula.js', dataType: 'date' },
            ],
          });

          await db.sync();

          const test = await Test.model.create<any>({
            a: now,
          });
          expect(test.get('result')).toEqual(now);
        });
      });
    });
  });
});
