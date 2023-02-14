import { Database, mockDatabase } from '@nocobase/database';
import { FormulaField } from '../formula-field';

describe('formula field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    db.registerFieldTypes({
      formula: FormulaField,
    });
  });

  afterEach(async () => {
    await db.close();
  });

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
