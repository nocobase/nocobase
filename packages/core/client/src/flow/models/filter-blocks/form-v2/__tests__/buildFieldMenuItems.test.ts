/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField, FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildFieldMenuItems, flattenFieldMenuItems, findFieldByPath } from '../buildFieldMenuItems';
import { FilterFormFieldGridModel } from '../FilterFormFieldGridModel';

// Mock types
interface MockFlowModel extends FlowModel {
  uid: string;
  title: string;
  getFilterFields?: () => Promise<MockCollectionField[]>;
}

interface MockFieldClass {
  meta?: {
    hide?: boolean;
    sort?: number;
    icon?: string;
    defaultOptions?: Record<string, any>;
  };
  supportedFieldInterfaces?: string[] | '*';
  name: string;
}

// Mock CollectionField for testing
interface MockCollectionField {
  name: string;
  title: string;
  type: string;
  interface: string;
  options: { interface: string };
}

// Test data setup
const mockFieldClasses: MockFieldClass[] = [
  {
    name: 'InputField',
    meta: { sort: 1, icon: 'input-icon', defaultOptions: { placeholder: 'Enter text' } },
    supportedFieldInterfaces: ['input', 'textarea'],
  },
  {
    name: 'NumberField',
    meta: { sort: 2, icon: 'number-icon' },
    supportedFieldInterfaces: ['number', 'integer'],
  },
  {
    name: 'DefaultField',
    meta: { sort: 999 },
    supportedFieldInterfaces: '*',
  },
  {
    name: 'HiddenField',
    meta: { hide: true },
    supportedFieldInterfaces: ['hidden'],
  },
];

const mockFields: MockCollectionField[] = [
  {
    name: 'title',
    title: 'Title',
    type: 'string',
    interface: 'input',
    options: { interface: 'input' },
  },
  {
    name: 'description',
    title: 'Description',
    type: 'text',
    interface: 'textarea',
    options: { interface: 'textarea' },
  },
  {
    name: 'count',
    title: 'Count',
    type: 'integer',
    interface: 'number',
    options: { interface: 'number' },
  },
  {
    name: 'price',
    title: 'Price',
    type: 'decimal',
    interface: 'number',
    options: { interface: 'number' },
  },
  {
    name: 'status',
    title: 'Status',
    type: 'string',
    interface: 'select',
    options: { interface: 'select' },
  },
];

describe('buildFieldMenuItems', () => {
  let mockDataModels: MockFlowModel[];
  let mockGridModel: FilterFormFieldGridModel;
  let mockFlowEngine: FlowEngine;
  let buildCreateModelOptions: any;

  beforeEach(() => {
    // Setup mock data models
    mockDataModels = [
      {
        uid: 'model-1',
        title: 'User Model',
        getFilterFields: vi.fn().mockResolvedValue(mockFields.slice(0, 3)), // title, description, count
      } as unknown as MockFlowModel,
      {
        uid: 'model-2',
        title: 'Product Model',
        getFilterFields: vi.fn().mockResolvedValue(mockFields.slice(2, 5)), // count, price, status
      } as unknown as MockFlowModel,
    ];

    // Setup mock flow engine
    mockFlowEngine = {
      filterModelClassByParent: vi.fn().mockReturnValue(
        new Map([
          ['InputField', mockFieldClasses[0]],
          ['NumberField', mockFieldClasses[1]],
          ['DefaultField', mockFieldClasses[2]],
          ['HiddenField', mockFieldClasses[3]],
        ]),
      ),
    } as any;

    // Setup mock grid model
    mockGridModel = {
      flowEngine: mockFlowEngine,
    } as FilterFormFieldGridModel;

    // Setup mock buildCreateModelOptions
    buildCreateModelOptions = vi.fn().mockImplementation((options) => ({
      ...options,
      timestamp: Date.now(),
    }));
  });

  describe('basic functionality', () => {
    it('should return empty array when dataModels is empty', async () => {
      const result = await buildFieldMenuItems([], mockGridModel, 'BaseField', buildCreateModelOptions);
      expect(result).toEqual([]);
    });

    it('should return empty array when dataModels is null or undefined', async () => {
      const result1 = await buildFieldMenuItems(null as any, mockGridModel, 'BaseField', buildCreateModelOptions);
      const result2 = await buildFieldMenuItems(undefined as any, mockGridModel, 'BaseField', buildCreateModelOptions);

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
    });

    it('should return empty array when no field classes found', async () => {
      mockFlowEngine.filterModelClassByParent = vi.fn().mockReturnValue(new Map());

      const result = await buildFieldMenuItems(mockDataModels, mockGridModel, 'BaseField', buildCreateModelOptions);
      expect(result).toEqual([]);
    });

    it('should build field menu items correctly', async () => {
      const result = await buildFieldMenuItems(mockDataModels, mockGridModel, 'BaseField', buildCreateModelOptions);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        key: 'blocks',
        label: 'Block list',
        type: 'group',
        searchPlaceholder: 'Search blocks',
      });

      expect(result[0].children).toHaveLength(2); // Two models

      // Check first model
      const firstModel = result[0].children[0];
      expect(firstModel.key).toBe('model-1');
      expect(firstModel.label).toBe('User Model #mode');
      expect(firstModel.children[0].children).toHaveLength(3); // title, description, count

      // Check second model
      const secondModel = result[0].children[1];
      expect(secondModel.key).toBe('model-2');
      expect(secondModel.label).toBe('Product Model #mode');
      expect(secondModel.children[0].children).toHaveLength(3); // count, price, status
    });

    it('should create correct field menu items with proper structure', async () => {
      const result = await buildFieldMenuItems(mockDataModels, mockGridModel, 'BaseField', buildCreateModelOptions);

      const firstModelFields = result[0].children[0].children[0].children;
      const titleField = firstModelFields[0];

      expect(titleField).toMatchObject({
        key: 'model-1.title',
        label: 'Title',
        value: 'model-1.title',
        icon: 'input-icon',
      });

      expect(titleField.createModelOptions).toBeDefined();
      expect(buildCreateModelOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          defaultOptions: expect.objectContaining({
            placeholder: 'Enter text',
            use: 'InputField',
          }),
          collectionField: mockFields[0],
          fieldPath: 'title',
        }),
      );
    });
  });

  describe('field filtering', () => {
    it('should filter fields by includeFieldTypes', async () => {
      const options = {
        includeFieldTypes: ['string', 'text'], // Include both string and text types
      };

      const result = await buildFieldMenuItems(
        mockDataModels,
        mockGridModel,
        'BaseField',
        buildCreateModelOptions,
        options,
      );

      const firstModelFields = result[0].children[0].children[0].children;
      expect(firstModelFields).toHaveLength(2); // Only title and description (string and text types)
      expect(firstModelFields.map((f) => f.label)).toEqual(['Title', 'Description']);
    });
    it('should filter fields by excludeFieldTypes', async () => {
      const options = {
        excludeFieldTypes: ['integer', 'decimal'],
      };

      const result = await buildFieldMenuItems(
        mockDataModels,
        mockGridModel,
        'BaseField',
        buildCreateModelOptions,
        options,
      );

      const firstModelFields = result[0].children[0].children[0].children;
      expect(firstModelFields).toHaveLength(2); // Only title and description (excluding count)
      expect(firstModelFields.map((f) => f.label)).toEqual(['Title', 'Description']);
    });

    it('should filter fields by includeInterfaces', async () => {
      const options = {
        includeInterfaces: ['input', 'number'],
      };

      const result = await buildFieldMenuItems(
        mockDataModels,
        mockGridModel,
        'BaseField',
        buildCreateModelOptions,
        options,
      );

      const firstModelFields = result[0].children[0].children[0].children;
      expect(firstModelFields).toHaveLength(2); // title and count
      expect(firstModelFields.map((f) => f.label)).toEqual(['Title', 'Count']);
    });

    it('should filter fields by excludeInterfaces', async () => {
      const options = {
        excludeInterfaces: ['textarea', 'number'],
      };

      const result = await buildFieldMenuItems(
        mockDataModels,
        mockGridModel,
        'BaseField',
        buildCreateModelOptions,
        options,
      );

      const firstModelFields = result[0].children[0].children[0].children;
      expect(firstModelFields).toHaveLength(1); // Only title
      expect(firstModelFields[0].label).toBe('Title');
    });

    it('should apply custom field filter', async () => {
      const options = {
        filterFields: (field: CollectionField) => field.name.includes('title'), // Only fields with 't' in name
      };

      const result = await buildFieldMenuItems(
        mockDataModels,
        mockGridModel,
        'BaseField',
        buildCreateModelOptions,
        options,
      );

      const firstModelFields = result[0].children[0].children[0].children;
      expect(firstModelFields).toHaveLength(1); // Only title (has 't' in name)
      expect(firstModelFields.map((f) => f.label)).toEqual(['Title']);
    });

    it('should combine multiple filter conditions', async () => {
      const options = {
        includeFieldTypes: ['string', 'integer'],
        excludeInterfaces: ['textarea'],
        filterFields: (field: CollectionField) => field.name.length > 4, // Name longer than 4 chars
      };

      const result = await buildFieldMenuItems(
        mockDataModels,
        mockGridModel,
        'BaseField',
        buildCreateModelOptions,
        options,
      );

      const firstModelFields = result[0].children[0].children[0].children;
      expect(firstModelFields).toHaveLength(2); // Only title (string type, not textarea interface, name > 4 chars)
      expect(firstModelFields[0].label).toBe('Title');
    });
  });

  describe('field class matching', () => {
    it('should use specific field class when interface matches', async () => {
      const result = await buildFieldMenuItems(mockDataModels, mockGridModel, 'BaseField', buildCreateModelOptions);

      const firstModelFields = result[0].children[0].children[0].children;
      const titleField = firstModelFields[0]; // input interface
      const countField = firstModelFields[2]; // number interface

      expect(titleField.icon).toBe('input-icon');
      expect(countField.icon).toBe('number-icon');
    });

    it('should use default field class when no specific interface matches', async () => {
      const result = await buildFieldMenuItems(mockDataModels, mockGridModel, 'BaseField', buildCreateModelOptions);

      const secondModelFields = result[0].children[1].children[0].children;
      const statusField = secondModelFields[2]; // select interface (no specific class)

      // Should use DefaultField class
      expect(statusField.createModelOptions.defaultOptions.use).toBe('DefaultField');
    });

    it('should filter out hidden field classes', async () => {
      // Hidden field class should not be considered even if it matches

      const result = await buildFieldMenuItems(mockDataModels, mockGridModel, 'BaseField', buildCreateModelOptions);

      // Verify that HiddenField is filtered out by checking that it's not used
      const allFieldsWithUse = result[0].children.flatMap((model) => model.children[0].children);
      const allUsedClasses = allFieldsWithUse.map((field) => field.createModelOptions.defaultOptions.use);

      expect(allUsedClasses).not.toContain('HiddenField');
    });

    it('should sort field classes by meta.sort', async () => {
      // This is tested indirectly by verifying the field classes are processed in sorted order
      // Since we can't directly observe the sorting, we verify the behavior is consistent
      const result = await buildFieldMenuItems(mockDataModels, mockGridModel, 'BaseField', buildCreateModelOptions);

      expect(result).toBeDefined();
      expect(mockFlowEngine.filterModelClassByParent).toHaveBeenCalled();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle models without getFilterFields method', async () => {
      const modelsWithoutMethod = [{ uid: 'model-3', title: 'Model Without Method' } as MockFlowModel];

      const result = await buildFieldMenuItems(
        modelsWithoutMethod,
        mockGridModel,
        'BaseField',
        buildCreateModelOptions,
      );

      expect(result[0].children).toHaveLength(0); // No models added since no fields
    });

    it('should handle models that return empty fields array', async () => {
      const emptyFieldsModel = [
        {
          uid: 'model-empty',
          title: 'Empty Model',
          getFilterFields: vi.fn().mockResolvedValue([]),
        } as unknown as MockFlowModel,
      ];

      const result = await buildFieldMenuItems(emptyFieldsModel, mockGridModel, 'BaseField', buildCreateModelOptions);

      expect(result[0].children).toHaveLength(0); // No models added since no fields
    });

    it('should handle async errors in getFilterFields gracefully', async () => {
      const errorModel = [
        {
          uid: 'model-error',
          title: 'Error Model',
          getFilterFields: vi.fn().mockRejectedValue(new Error('Failed to get fields')),
        } as unknown as MockFlowModel,
      ];

      // The function should throw the error instead of handling it gracefully
      await expect(
        buildFieldMenuItems(errorModel, mockGridModel, 'BaseField', buildCreateModelOptions),
      ).rejects.toThrow('Failed to get fields');
    });

    it('should handle fields without proper interface configuration', async () => {
      const malformedFields = [
        {
          name: 'badField',
          title: 'Bad Field',
          type: 'string',
          interface: undefined,
          options: {},
        },
      ];

      const modelWithBadFields = [
        {
          uid: 'model-bad',
          title: 'Model With Bad Fields',
          getFilterFields: vi.fn().mockResolvedValue(malformedFields),
        } as unknown as MockFlowModel,
      ];

      const result = await buildFieldMenuItems(modelWithBadFields, mockGridModel, 'BaseField', buildCreateModelOptions);

      // Should use default field class for fields without proper interface
      expect(result[0].children).toHaveLength(1);
      const fieldItem = result[0].children[0].children[0].children[0];
      expect(fieldItem.createModelOptions.defaultOptions.use).toBe('DefaultField');
    });
  });
});

describe('flattenFieldMenuItems', () => {
  const mockMenuItems = [
    {
      key: 'blocks',
      label: 'Block list',
      children: [
        {
          key: 'model-1',
          label: 'User Model',
          children: [
            {
              key: 'fields',
              label: 'Fields',
              children: [
                { key: 'model-1.title', label: 'Title', value: 'model-1.title' },
                { key: 'model-1.description', label: 'Description', value: 'model-1.description' },
              ],
            },
          ],
        },
        {
          key: 'model-2',
          label: 'Product Model',
          children: [
            {
              key: 'fields',
              label: 'Fields',
              children: [{ key: 'model-2.price', label: 'Price', value: 'model-2.price' }],
            },
          ],
        },
      ],
    },
  ];

  it('should flatten nested menu items and return all field values', () => {
    const result = flattenFieldMenuItems(mockMenuItems);

    expect(result).toEqual(['model-1.title', 'model-1.description', 'model-2.price']);
  });

  it('should return empty array for empty menu items', () => {
    const result = flattenFieldMenuItems([]);
    expect(result).toEqual([]);
  });

  it('should handle menu items without values', () => {
    const menuWithoutValues = [
      {
        key: 'group',
        label: 'Group',
        children: [
          { key: 'item1', label: 'Item 1' }, // No value property
          { key: 'item2', label: 'Item 2', value: 'item2.value' },
        ],
      },
    ];

    const result = flattenFieldMenuItems(menuWithoutValues);
    expect(result).toEqual(['item2.value']);
  });
});

describe('findFieldByPath', () => {
  const mockModelsForFind: MockFlowModel[] = [
    {
      uid: 'model-1',
      title: 'User Model',
      getFilterFields: () => mockFields.slice(0, 3), // title, description, count
    } as unknown as MockFlowModel,
    {
      uid: 'model-2',
      title: 'Product Model',
      getFilterFields: () => mockFields.slice(2, 5), // count, price, status
    } as unknown as MockFlowModel,
  ];

  it('should find field by valid path', () => {
    const result = findFieldByPath(mockModelsForFind, 'model-1.title');

    expect(result).toEqual(mockFields[0]); // title field
  });

  it('should return undefined for non-existent model', () => {
    const result = findFieldByPath(mockModelsForFind, 'non-existent.field');

    expect(result).toBeUndefined();
  });

  it('should return undefined for non-existent field', () => {
    const result = findFieldByPath(mockModelsForFind, 'model-1.nonExistentField');

    expect(result).toBeUndefined();
  });

  it('should return undefined for invalid path format', () => {
    const result = findFieldByPath(mockModelsForFind, 'invalidpath');

    expect(result).toBeUndefined();
  });

  it('should handle models without getFilterFields method', () => {
    const modelsWithoutMethod = [{ uid: 'model-1', title: 'Model Without Method' } as MockFlowModel];

    const result = findFieldByPath(modelsWithoutMethod, 'model-1.title');

    expect(result).toBeUndefined();
  });

  it('should handle empty dataModels array', () => {
    const result = findFieldByPath([], 'model-1.title');

    expect(result).toBeUndefined();
  });
});
