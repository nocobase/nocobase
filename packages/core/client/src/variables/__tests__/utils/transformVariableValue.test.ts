import { transformVariableValue } from '../../utils/transformVariableValue';

describe('transformVariableValue', () => {
  test('should return value as it is when targetCollectionFiled.type is "belongsTo" and value is not an array', () => {
    const value = {
      name: 'test',
    };
    const deps = {
      targetCollectionField: { type: 'belongsTo', uiSchema: { 'x-component': 'Text' } },
    };

    const result = transformVariableValue(value, deps as any);

    expect(result).toBe(value);
  });

  test('should return value as it is when targetCollectionFiled.type is "hasOne" and value is not an array', () => {
    const value = {
      name: 'test',
    };
    const deps = {
      targetCollectionField: { type: 'hasOne', uiSchema: { 'x-component': 'Text' } },
    };

    const result = transformVariableValue(value, deps as any);

    expect(result).toBe(value);
  });

  test('should return an array containing the value when targetCollectionFiled.type is "hasMany" and value is not an array', () => {
    const value = {
      name: 'test',
    };
    const deps = {
      targetCollectionField: { type: 'hasMany', uiSchema: { 'x-component': 'Text' } },
    };

    const result = transformVariableValue(value, deps as any);

    expect(result).toEqual([value]);
  });

  test('should return value as it is when targetCollectionFiled.type is "hasMany" and value is an array', () => {
    const value = [
      {
        name: 'test1',
      },
      {
        name: 'test2',
      },
    ];
    const deps = {
      targetCollectionField: { type: 'hasMany', uiSchema: { 'x-component': 'Text' } },
    };

    const result = transformVariableValue(value, deps as any);

    expect(result).toBe(value);
  });

  test('should return value as it is when targetCollectionFiled.type is "belongsToMany" and value is not an array', () => {
    const value = {
      name: 'test',
    };
    const deps = {
      targetCollectionField: { type: 'belongsToMany', uiSchema: { 'x-component': 'Text' } },
    };

    const result = transformVariableValue(value, deps as any);

    expect(result).toEqual([value]);
  });

  test('should return an array containing the value when targetCollectionFiled.type is "belongsToMany" and value is an array', () => {
    const value = [
      {
        name: 'test1',
      },
      {
        name: 'test2',
      },
    ];
    const deps = {
      targetCollectionField: { type: 'belongsToMany', uiSchema: { 'x-component': 'Text' } },
    };

    const result = transformVariableValue(value, deps as any);

    expect(result).toEqual(value);
  });

  test('json', () => {
    const value = { a: 1 };
    const deps = {
      targetCollectionField: { type: 'string', interface: 'json', uiSchema: { 'x-component': 'Text' } },
    };

    const result = transformVariableValue(value, deps as any);

    expect(result).toMatchInlineSnapshot(`
      {
        "a": 1,
      }
    `);
  });

  test('value is undefined', () => {
    const value = undefined;
    const deps = {
      targetCollectionField: { type: 'belongsToMany', uiSchema: { 'x-component': 'AssociationField' } },
    };

    const result = transformVariableValue(value, deps as any);

    expect(result).toMatchInlineSnapshot(`undefined`);
  });
});
