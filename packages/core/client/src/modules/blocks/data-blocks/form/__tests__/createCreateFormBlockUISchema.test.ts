import { ISchema } from '@formily/react';
import { createCreateFormBlockUISchema } from '../createCreateFormBlockUISchema';

describe('createCreateFormBlockUISchema', () => {
  it('should create a schema with required options only', () => {
    const options = {
      collectionName: 'users',
      dataSource: 'userDataSource',
    };
    const expected: ISchema = {
      type: 'void',
      'x-acl-action-props': { skipScopeCheck: true },
      'x-acl-action': 'users:create',
      'x-decorator': 'FormBlockProvider',
      'x-decorator-props': { dataSource: 'userDataSource', collection: 'users' },
      'x-toolbar': 'BlockSchemaToolbar',
      'x-settings': 'blockSettings:createForm',
      'x-component': 'CardItem',
      properties: expect.any(Object),
    };

    const result = createCreateFormBlockUISchema(options);
    expect(result).toMatchObject(expected);
    expect(result.properties).toHaveProperty(Object.keys(result.properties)[0]);
  });

  it('should create a schema with an association', () => {
    const options = {
      collectionName: 'users',
      dataSource: 'userDataSource',
      association: 'userGroup',
    };
    const result = createCreateFormBlockUISchema(options);
    expect(result['x-acl-action']).toBe('userGroup:create');
    expect(result['x-decorator-props'].association).toBe('userGroup');
  });

  it('should create a schema with a templateSchema', () => {
    const templateSchema: ISchema = {
      type: 'void',
      'x-component': 'CustomTemplate',
      properties: {},
    };
    const options = {
      collectionName: 'users',
      dataSource: 'userDataSource',
      templateSchema,
    };
    const result = createCreateFormBlockUISchema(options);
    expect(result.properties[Object.keys(result.properties)[0]].properties.grid).toBe(templateSchema);
  });

  it('should handle empty options appropriately', () => {
    const options: any = {}; // Intentional to test function robustness
    const action = () => createCreateFormBlockUISchema(options);

    expect(action).toThrowError(); // Assuming the original function has validation and throws an error for missing required fields
  });
});
