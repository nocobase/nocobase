/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterGroup, FilterItem } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterManager } from '../FilterManager';

describe('FilterManager.bindToTarget', () => {
  let mockGridModel: any;
  let mockFlowEngine: any;
  let filterManager: FilterManager;

  beforeEach(() => {
    // Mock flowEngine
    mockFlowEngine = {
      getModel: vi.fn(),
    };

    // Mock gridModel
    mockGridModel = {
      flowEngine: mockFlowEngine,
      getStepParams: vi.fn().mockReturnValue([]),
      setStepParams: vi.fn(),
      save: vi.fn(),
      saveStepParams: vi.fn().mockResolvedValue(undefined),
    };

    filterManager = new FilterManager(mockGridModel);
  });

  describe('filter configuration handling', () => {
    let mockTargetModel: any;

    beforeEach(() => {
      mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
        },
        setFilterActive: vi.fn(),
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);
    });

    it('should return early when no related filter configurations exist', () => {
      // No filter configs in the manager
      filterManager.bindToTarget('target-model-uid');

      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });
  });

  describe('successful binding', () => {
    let mockTargetModel: any;
    let mockFilterModel: any;

    beforeEach(() => {
      mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
        },
        setFilterActive: vi.fn(),
      };

      mockFilterModel = {
        getFilterValue: vi.fn().mockReturnValue('test-value'),
      };

      mockFlowEngine.getModel.mockImplementation((uid: string) => {
        if (uid === 'target-model-uid') return mockTargetModel;
        if (uid === 'filter-1') return mockFilterModel;
        return null;
      });
    });

    it('should bind single filter condition correctly', async () => {
      // Add a filter config with single target field
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));

      // Check the FilterItem construction
      const call = mockTargetModel.resource.addFilterGroup.mock.calls[0];
      const filterItem = call[1];
      expect(filterItem).toBeInstanceOf(FilterItem);
    });

    it('should bind multiple filter conditions correctly', async () => {
      // Add a filter config with multiple target fields
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name', 'email'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterGroup));

      // Check the FilterGroup construction
      const call = mockTargetModel.resource.addFilterGroup.mock.calls[0];
      const filterGroup = call[1];
      expect(filterGroup).toBeInstanceOf(FilterGroup);
    });

    it('should use operator when available', async () => {
      // Add a filter config with operator
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$ne',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledTimes(1);

      // Verify that the FilterItem uses the operator
      const call = mockTargetModel.resource.addFilterGroup.mock.calls[0];
      const filterItem = call[1];
      expect(filterItem.options.operator).toBe('$ne');
    });

    it('should bind multiple filter configurations for the same target', async () => {
      // Add multiple filter configs for the same target
      const filterConfig1 = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      const filterConfig2 = {
        filterId: 'filter-2',
        targetId: 'target-model-uid',
        filterPaths: ['email'],
        operator: '$contains',
      };

      await filterManager.addFilterConfig(filterConfig1);
      await filterManager.addFilterConfig(filterConfig2);

      // Mock the second filter model
      const mockFilterModel2 = {
        getFilterValue: vi.fn().mockReturnValue('test-value-2'),
      };

      mockFlowEngine.getModel.mockImplementation((uid: string) => {
        if (uid === 'target-model-uid') return mockTargetModel;
        if (uid === 'filter-1') return mockFilterModel;
        if (uid === 'filter-2') return mockFilterModel2;
        return null;
      });

      filterManager.bindToTarget('target-model-uid');

      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledTimes(2);
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenNthCalledWith(1, 'filter-1', expect.any(FilterItem));
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenNthCalledWith(2, 'filter-2', expect.any(FilterItem));
    });
  });

  describe('empty filter value handling', () => {
    let mockTargetModel: any;
    let mockFilterModel: any;

    beforeEach(() => {
      mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
        },
        setFilterActive: vi.fn(),
      };

      mockFilterModel = {
        getFilterValue: vi.fn(),
      };

      mockFlowEngine.getModel.mockImplementation((uid: string) => {
        if (uid === 'target-model-uid') return mockTargetModel;
        if (uid === 'filter-1') return mockFilterModel;
        return null;
      });
    });

    it('should call removeFilterGroup when filter value is null', async () => {
      mockFilterModel.getFilterValue.mockReturnValue(null);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should call removeFilterGroup when filter value is undefined', async () => {
      mockFilterModel.getFilterValue.mockReturnValue(undefined);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should call removeFilterGroup when filter value is empty string', async () => {
      mockFilterModel.getFilterValue.mockReturnValue('');

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should handle mixed empty and valid filter values correctly', async () => {
      // Setup multiple filter models
      const mockFilterModel2 = {
        getFilterValue: vi.fn().mockReturnValue('valid-value'),
      };

      mockFilterModel.getFilterValue.mockReturnValue(null); // Empty value

      mockFlowEngine.getModel.mockImplementation((uid: string) => {
        if (uid === 'target-model-uid') return mockTargetModel;
        if (uid === 'filter-1') return mockFilterModel;
        if (uid === 'filter-2') return mockFilterModel2;
        return null;
      });

      // Add configs for both filters
      const filterConfig1 = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      const filterConfig2 = {
        filterId: 'filter-2',
        targetId: 'target-model-uid',
        filterPaths: ['email'],
        operator: '$contains',
      };

      await filterManager.addFilterConfig(filterConfig1);
      await filterManager.addFilterConfig(filterConfig2);

      filterManager.bindToTarget('target-model-uid');

      // Should remove filter-1 (null value) and add filter-2 (valid value)
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-2', expect.any(FilterItem));
    });

    it('should not call removeFilterGroup for valid non-empty values', async () => {
      mockFilterModel.getFilterValue.mockReturnValue('valid-value');

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));
    });

    it('should treat zero as a valid value and not call removeFilterGroup', async () => {
      mockFilterModel.getFilterValue.mockReturnValue(0);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['count'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));
    });

    it('should treat false as a valid value and not call removeFilterGroup', async () => {
      mockFilterModel.getFilterValue.mockReturnValue(false);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['active'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));
    });

    it('should call removeFilterGroup when filter value is empty object', async () => {
      mockFilterModel.getFilterValue.mockReturnValue({});

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['metadata'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should call removeFilterGroup when filter value is empty array', async () => {
      mockFilterModel.getFilterValue.mockReturnValue([]);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['tags'],
        operator: '$in',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should call removeFilterGroup when filter value array only contains empty values', async () => {
      mockFilterModel.getFilterValue.mockReturnValue(['', '']);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['range'],
        operator: '$dateBetween',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should not call removeFilterGroup for non-empty object', async () => {
      mockFilterModel.getFilterValue.mockReturnValue({ key: 'value' });

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['metadata'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));
    });

    it('should not call removeFilterGroup for non-empty array', async () => {
      mockFilterModel.getFilterValue.mockReturnValue(['tag1', 'tag2']);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['tags'],
        operator: '$in',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));
    });
  });
});
