import { mockDatabase } from '.';
import { Database, MagicAttributeModel } from '..';

describe('magic-attribute-model', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('case 0', async () => {
    db.registerModels({ MagicAttributeModel });

    const Test = db.collection({
      name: 'tests',
      model: 'MagicAttributeModel',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'json', name: 'options' },
      ],
    });

    await db.sync();

    const test = await Test.model.create({
      title: 'aa',
      'x-component-props': { key1: 'val1', arr1: [1, 2, 3], arr2: [4, 5] },
    });

    test.set('x-component-props', { arr2: [1, 2, 3] });

    expect(test.previous('options')['x-component-props']['arr2']).toEqual([4, 5]);
  });

  it('case 1', async () => {
    db.registerModels({ MagicAttributeModel });

    const Test = db.collection({
      name: 'tests',
      model: 'MagicAttributeModel',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'json', name: 'options' },
      ],
    });

    await db.sync();

    const test = await Test.model.create({
      title: 'aa',
      'x-component-props': { key1: 'val1', arr1: [1, 2, 3], arr2: [4, 5] },
    });

    test.set({
      'x-component-props': { key2: 'val2', arr1: [3, 4] },
      'x-decorator-props': { key1: 'val1' },
    });

    test.set('x-component-props', { arr2: [1, 2, 3] });

    await test.save();

    expect(test.toJSON()).toMatchObject({
      title: 'aa',
      'x-component-props': {
        key1: 'val1',
        key2: 'val2',
        arr1: [3, 4],
        arr2: [1, 2, 3],
      },
      'x-decorator-props': { key1: 'val1' },
    });
  });

  it('case 2', async () => {
    db.registerModels({ MagicAttributeModel });

    const Test = db.collection({
      name: 'tests',
      model: 'MagicAttributeModel',
      magicAttribute: 'schema',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'json', name: 'schema' },
      ],
    });

    await db.sync();

    let test = await Test.model.create({
      title: 'aa',
      'x-component-props': { key1: 'val1', arr1: [1, 2, 3], arr2: [4, 5] },
    });

    test.set({
      'x-component-props': { key2: 'val2', arr1: [3, 4] },
      'x-decorator-props': { key1: 'val1' },
    });

    test.set('x-component-props', { arr2: [1, 2, 3] });

    await test.save();

    test = await Test.model.findByPk(test.get('id') as string);

    await test.update({
      'x-component-props': { arr2: [1, 2, 3, 4] },
    });

    test = await Test.model.findByPk(test.get('id') as string);

    expect(test.toJSON()).toMatchObject({
      title: 'aa',
      'x-component-props': {
        key1: 'val1',
        key2: 'val2',
        arr1: [3, 4],
        arr2: [1, 2, 3, 4],
      },
      'x-decorator-props': { key1: 'val1' },
    });
  });
});
