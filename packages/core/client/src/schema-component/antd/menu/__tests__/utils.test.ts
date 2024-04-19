import { Schema } from '@formily/json-schema';

import { findMenuItem } from '../util';

describe('findMenuItem', () => {
  test('should return null for invalid schema', () => {
    const result = findMenuItem(null);
    expect(result).toBeNull();
  });

  test('should return null if no Menu.Item schema found', () => {
    const schema = new Schema({
      properties: {
        prop1: {
          type: 'string',
        },
        prop2: {
          type: 'number',
        },
      },
    });
    const result = findMenuItem(schema);
    expect(result).toBeNull();
  });

  test('should return the first Menu.Item schema found', () => {
    const schema = new Schema({
      properties: {
        prop1: {
          type: 'string',
        },
        prop2: {
          type: 'number',
        },
        menuItem: {
          type: 'object',
          'x-uid': 'test',
          'x-component': 'Menu.Item',
        },
      },
    });
    const result = findMenuItem(schema);
    expect(result).toEqual(
      expect.objectContaining({
        type: 'object',
        'x-uid': 'test',
        'x-component': 'Menu.Item',
      }),
    );
  });

  test('should return the first Menu.Item schema found recursively', () => {
    const schema = new Schema({
      properties: {
        prop1: {
          type: 'string',
        },
        prop2: {
          type: 'number',
        },
        menuItem: {
          type: 'object',
          'x-component': 'test',
          properties: {
            nestedMenuItem: {
              type: 'object',
              'x-uid': 'test',
              'x-component': 'Menu.Item',
            },
          },
        },
      },
    });
    const result = findMenuItem(schema);
    expect(result).toEqual(
      expect.objectContaining({
        type: 'object',
        'x-uid': 'test',
        'x-component': 'Menu.Item',
      }),
    );
  });
});
