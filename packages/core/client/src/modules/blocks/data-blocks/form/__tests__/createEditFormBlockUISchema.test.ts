import { ISchema } from '@formily/react';
import { vi } from 'vitest';
import { createEditFormBlockUISchema } from '../createEditFormBlockUISchema';

vi.mock('@formily/shared', () => ({
  uid: () => 'uniqueId',
}));

describe('createEditFormBlockUISchema', () => {
  it('should return a valid schema with mandatory fields', () => {
    const schema = createEditFormBlockUISchema({
      collectionName: 'users',
      dataSource: 'UserDataSource',
    });

    expect(schema).toEqual(
      expect.objectContaining({
        type: 'void',
        'x-acl-action': 'users:update',
        'x-decorator': 'FormBlockProvider',
        'x-component': 'CardItem',
        'x-decorator-props': {
          action: 'get',
          dataSource: 'UserDataSource',
          collection: 'users',
        },
        properties: expect.any(Object),
      }),
    );
  });

  it('should use the association name in the x-acl-action if provided', () => {
    const schema = createEditFormBlockUISchema({
      collectionName: 'users',
      dataSource: 'UserDataSource',
      association: 'userProfiles',
    });

    expect(schema['x-acl-action']).toBe('userProfiles:update');
  });

  it('throws an error if collectionName or dataSource is missing', () => {
    expect(() => {
      createEditFormBlockUISchema({
        collectionName: '',
        dataSource: '',
      });
    }).toThrowError('collectionName and dataSource are required');

    expect(() => {
      createEditFormBlockUISchema({
        dataSource: 'UserDataSource',
      } as any);
    }).toThrowError('collectionName and dataSource are required');

    expect(() => {
      createEditFormBlockUISchema({
        collectionName: 'users',
      } as any);
    }).toThrowError('collectionName and dataSource are required');
  });

  it('adds templateSchema to the properties if provided', () => {
    const customTemplateSchema: ISchema = {
      type: 'void',
      'x-component': 'CustomComponent',
    };
    const schema = createEditFormBlockUISchema({
      collectionName: 'users',
      dataSource: 'UserDataSource',
      templateSchema: customTemplateSchema,
    });

    // @ts-ignore
    expect(schema.properties.uniqueId.properties.grid).toEqual(customTemplateSchema);
  });

  it('generates unique IDs for properties', () => {
    const schema = createEditFormBlockUISchema({
      collectionName: 'users',
      dataSource: 'UserDataSource',
    });

    expect(Object.keys(schema.properties)).toEqual(['uniqueId']);
    // @ts-ignore
    expect(Object.keys(schema.properties.uniqueId.properties)).toContain('uniqueId');
  });
});
