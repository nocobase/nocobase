import { mockDatabase } from '..';
import { Database } from '../../database';
import { FormulaField } from '../../fields';

describe('formula field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('add formula field with old table, already has data.', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        { type: 'float', name: 'price' },
        { type: 'float', name: 'count' },
      ],
    });

    await db.sync();

    const test = await Test.model.create<any>({
      price: '1.2',
      count: '2',
    });

    const expression = 'price*count';
    const field = Test.addField('sum', { type: 'formula', expression });

    await field.sync({});

    const updatedTest = await Test.model.findByPk(test.id);
    const sum = updatedTest.get('sum');

    const sumField = Test.getField<FormulaField>('sum');
    expect(sum).toEqual(sumField.caculate(expression, updatedTest.toJSON()));
  });

  it('auto set formula field with create or update data', async () => {
    const expression = 'price*count';
    const Test = db.collection({
      name: 'tests',
      fields: [
        { type: 'float', name: 'price' },
        { type: 'float', name: 'count' },
        { name: 'sum', type: 'formula', expression },
      ],
    });

    await db.sync();

    const test = await Test.model.create<any>({
      price: '1.2',
      count: '2',
    });

    const sumField = Test.getField<FormulaField>('sum');
    expect(test.get('sum')).toEqual(sumField.caculate(expression, test.toJSON()));

    test.set('count', '6');
    await test.save();
    expect(test.get('sum')).toEqual(sumField.caculate(expression, test.toJSON()));
  });
});
