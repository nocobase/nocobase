/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transformMultiColumnToSingleColumn } from '../transformMultiColumnToSingleColumn';

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Mock dependencies
vi.mock('../uid', () => ({
  uid: vi.fn(() => 'mocked-uid'),
}));

// Mock package.json
vi.mock('../../package.json', () => ({
  default: { version: '1.0.0' },
}));

describe('transformMultiColumnToSingleColumn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return schema as is if null or undefined', () => {
    expect(transformMultiColumnToSingleColumn(null)).toBeNull();
    expect(transformMultiColumnToSingleColumn(undefined)).toBeUndefined();
  });

  it('should recursively process non-Grid schemas', () => {
    const schema = {
      'x-component': 'Form',
      properties: {
        field1: {
          'x-component': 'Input',
        },
        grid1: {
          'x-component': 'Grid',
          properties: {
            row1: {
              'x-component': 'Grid.Row',
              properties: {
                col1: { 'x-component': 'Input' },
              },
            },
          },
        },
      },
    };

    const result = transformMultiColumnToSingleColumn(schema);

    // The non-Grid top level should remain, but child Grid should be transformed
    expect(result['x-component']).toBe('Form');
    expect(result.properties.grid1.properties.row1['x-index']).toBe(1);
  });

  it('should handle Grid with non-Grid.Row components', () => {
    const schema = {
      'x-component': 'Grid',
      properties: {
        nonRow: {
          'x-component': 'Input',
        },
      },
    };

    const result = transformMultiColumnToSingleColumn(schema);

    expect(result.properties.nonRow['x-index']).toBe(1);
  });

  it('should ignore Grid.Row without properties', () => {
    const schema = {
      'x-component': 'Grid',
      properties: {
        row1: {
          'x-component': 'Grid.Row',
          // No properties
        },
      },
    };

    const result = transformMultiColumnToSingleColumn(schema);

    expect(Object.keys(result.properties).length).toBe(0);
  });

  it('should keep Grid.Row with single column as is', () => {
    const schema = {
      'x-component': 'Grid',
      properties: {
        row1: {
          'x-component': 'Grid.Row',
          properties: {
            col1: { 'x-component': 'Input' },
          },
        },
      },
    };

    const result = transformMultiColumnToSingleColumn(schema);

    expect(result.properties.row1['x-index']).toBe(1);
    expect(Object.keys(result.properties.row1.properties).length).toBe(1);
    expect(result.properties.row1.properties.col1).toBeDefined();
  });

  it('should transform Grid.Row with multiple columns', () => {
    const schema = {
      'x-component': 'Grid',
      properties: {
        row1: {
          'x-component': 'Grid.Row',
          properties: {
            col1: { 'x-component': 'Input' },
            col2: { 'x-component': 'Select' },
          },
        },
      },
    };

    const result = transformMultiColumnToSingleColumn(schema);

    // Original row should keep only the first column
    expect(result.properties.row1['x-index']).toBe(1);
    expect(Object.keys(result.properties.row1.properties).length).toBe(1);
    expect(result.properties.row1.properties.col1).toBeDefined();

    // Second column should be transformed into a new row
    const newRowKey = 'mocked-uid_col2';
    expect(result.properties[newRowKey]).toBeDefined();
    expect(result.properties[newRowKey]['x-component']).toBe('Grid.Row');
    expect(result.properties[newRowKey]['x-index']).toBe(2);
    expect(result.properties[newRowKey].properties.col2).toBeDefined();
    expect(result.properties[newRowKey].properties.col2['x-component-props'].width).toBe(100);
  });

  it('should handle complex Grid schema with multiple rows and columns', () => {
    const schema = {
      'x-component': 'Grid',
      properties: {
        row1: {
          'x-component': 'Grid.Row',
          properties: {
            col1: { 'x-component': 'Input' },
            col2: { 'x-component': 'Select' },
            col3: { 'x-component': 'Checkbox' },
          },
        },
        row2: {
          'x-component': 'Grid.Row',
          properties: {
            col4: { 'x-component': 'DatePicker' },
          },
        },
        nonRow: {
          'x-component': 'Divider',
        },
        shouldRemove: {
          'x-component': 'Grid.Row',
          // No properties
        },
      },
    };

    const result = transformMultiColumnToSingleColumn(schema);

    // Check structure
    expect(Object.keys(result.properties).length).toBe(5); // row1 + 2 new rows from col2,col3 + row2 + nonRow

    // Check row1 (first column stays)
    expect(result.properties.row1['x-index']).toBe(1);
    expect(Object.keys(result.properties.row1.properties).length).toBe(1);
    expect(result.properties.row1.properties.col1).toBeDefined();

    // Check col2 became its own row
    expect(result.properties['mocked-uid_col2'].properties.col2).toBeDefined();
    expect(result.properties['mocked-uid_col2'].properties.col2['x-component-props'].width).toBe(100);

    // Check col3 became its own row (second call to uid would return the same mocked value)
    expect(result.properties['mocked-uid_col3'].properties.col3).toBeDefined();

    // Check row2 stayed intact
    expect(result.properties.row2['x-index']).toBe(4);
    expect(Object.keys(result.properties.row2.properties).length).toBe(1);
    expect(result.properties.row2.properties.col4).toBeDefined();

    // Check nonRow was processed
    expect(result.properties.nonRow['x-index']).toBe(5);

    // Check shouldRemove was ignored
    expect(Object.keys(result.properties).includes('shouldRemove')).toBe(false);
  });
});
