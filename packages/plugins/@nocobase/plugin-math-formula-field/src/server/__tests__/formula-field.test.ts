import { Database, mockDatabase } from '@nocobase/database';
import { MathFormulaField } from '../math-formula-field';

describe('formula field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    db.registerFieldTypes({
      mathFormula: MathFormulaField,
    });
  });

  afterEach(async () => {
    await db.close();
  });

  it('auto set formula field with create or update data', async () => {
    const expression = 'price*count';
    const Test = db.collection({
      name: 'tests',
      fields: [
        { type: 'float', name: 'price' },
        { type: 'float', name: 'count' },
        { name: 'sum', type: 'mathFormula', expression },
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
        { name: 'sum', type: 'mathFormula', expression },
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
        { name: 'sum', type: 'mathFormula', expression },
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
