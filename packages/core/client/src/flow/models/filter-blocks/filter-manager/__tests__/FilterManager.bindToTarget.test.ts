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
    };

    filterManager = new FilterManager(mockGridModel);
  });

  describe('parameter validation', () => {
    it('should throw error when targetId is empty string', () => {
      expect(() => {
        filterManager.bindToTarget('');
      }).toThrow('targetId must be a non-empty string');
    });

    it('should throw error when targetId is not a string', () => {
      expect(() => {
        filterManager.bindToTarget(null as any);
      }).toThrow('targetId must be a non-empty string');

      expect(() => {
        filterManager.bindToTarget(undefined as any);
      }).toThrow('targetId must be a non-empty string');

      expect(() => {
        filterManager.bindToTarget(123 as any);
      }).toThrow('targetId must be a non-empty string');
    });
  });

  describe('target model validation', () => {
    it('should throw error when target model is not found', () => {
      mockFlowEngine.getModel.mockReturnValue(null);

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow('Target model with uid "target-model-uid" not found');
    });

    it('should throw error when target model does not have resource property', () => {
      const mockTargetModel = {};
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow('Target model with uid "target-model-uid" does not have a valid resource with addFilterGroup method');
    });

    it('should throw error when target model resource does not have addFilterGroup method', () => {
      const mockTargetModel = {
        resource: {},
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow('Target model with uid "target-model-uid" does not have a valid resource with addFilterGroup method');
    });

    it('should throw error when target model resource does not have removeFilterGroup method', () => {
      const mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
        },
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow(
        'Target model with uid "target-model-uid" does not have a valid resource with removeFilterGroup method',
      );
    });

    it('should throw error when target model resource removeFilterGroup is not a function', () => {
      const mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: 'not-a-function',
        },
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow(
        'Target model with uid "target-model-uid" does not have a valid resource with removeFilterGroup method',
      );
    });
  });

  describe('filter configuration handling', () => {
    let mockTargetModel: any;

    beforeEach(() => {
      mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
        },
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);
    });

    it('should return early when no related filter configurations exist', () => {
      // No filter configs in the manager
      filterManager.bindToTarget('target-model-uid');

      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should throw error when filter model does not have getFilterValue method', () => {
      // Add a filter config
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      // Mock filter model without getFilterValue method
      const mockFilterModel = {};
      mockFlowEngine.getModel.mockImplementation((uid: string) => {
        if (uid === 'target-model-uid') return mockTargetModel;
        if (uid === 'filter-1') return mockFilterModel;
        return null;
      });

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow('Filter model with uid "filter-1" does not have getFilterValue method');
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

    it('should bind single filter condition correctly', () => {
      // Add a filter config with single target field
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));

      // Check the FilterItem construction
      const call = mockTargetModel.resource.addFilterGroup.mock.calls[0];
      const filterItem = call[1];
      expect(filterItem).toBeInstanceOf(FilterItem);
    });

    it('should bind multiple filter conditions correctly', () => {
      // Add a filter config with multiple target fields
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name', 'email'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterGroup));

      // Check the FilterGroup construction
      const call = mockTargetModel.resource.addFilterGroup.mock.calls[0];
      const filterGroup = call[1];
      expect(filterGroup).toBeInstanceOf(FilterGroup);
    });

    it('should use operator when available', () => {
      // Add a filter config with operator
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$ne',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledTimes(1);

      // Verify that the FilterItem uses the operator
      const call = mockTargetModel.resource.addFilterGroup.mock.calls[0];
      const filterItem = call[1];
      expect(filterItem.options.operator).toBe('$ne');
    });

    it('should bind multiple filter configurations for the same target', () => {
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

      filterManager.addFilterConfig(filterConfig1);
      filterManager.addFilterConfig(filterConfig2);

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

  describe('error handling', () => {
    let mockTargetModel: any;
    let mockFilterModel: any;

    beforeEach(() => {
      mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
        },
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

    it('should throw error when addFilterGroup method fails', () => {
      // Add a filter config
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      // Make addFilterGroup throw an error
      const originalError = new Error('Resource error');
      mockTargetModel.resource.addFilterGroup.mockImplementation(() => {
        throw originalError;
      });

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow('Failed to bind filter configuration to target model: Resource error');
    });

    it('should handle errors gracefully for multiple configurations', () => {
      // Add multiple filter configs
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

      filterManager.addFilterConfig(filterConfig1);
      filterManager.addFilterConfig(filterConfig2);

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

      // Make addFilterGroup fail for the first call only
      let callCount = 0;
      mockTargetModel.resource.addFilterGroup.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First filter failed');
        }
      });

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow('Failed to bind filter configuration to target model: First filter failed');
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

    it('should call removeFilterGroup when filter value is null', () => {
      mockFilterModel.getFilterValue.mockReturnValue(null);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should call removeFilterGroup when filter value is undefined', () => {
      mockFilterModel.getFilterValue.mockReturnValue(undefined);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should call removeFilterGroup when filter value is empty string', () => {
      mockFilterModel.getFilterValue.mockReturnValue('');

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).not.toHaveBeenCalled();
    });

    it('should handle mixed empty and valid filter values correctly', () => {
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

      filterManager.addFilterConfig(filterConfig1);
      filterManager.addFilterConfig(filterConfig2);

      filterManager.bindToTarget('target-model-uid');

      // Should remove filter-1 (null value) and add filter-2 (valid value)
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-2', expect.any(FilterItem));
    });

    it('should throw error when removeFilterGroup fails', () => {
      mockFilterModel.getFilterValue.mockReturnValue(null);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      // Make removeFilterGroup throw an error
      const originalError = new Error('Remove filter error');
      mockTargetModel.resource.removeFilterGroup.mockImplementation(() => {
        throw originalError;
      });

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow('Failed to remove filter configuration from target model: Remove filter error');
    });

    it('should not call removeFilterGroup for valid non-empty values', () => {
      mockFilterModel.getFilterValue.mockReturnValue('valid-value');

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));
    });

    it('should treat zero as a valid value and not call removeFilterGroup', () => {
      mockFilterModel.getFilterValue.mockReturnValue(0);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['count'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));
    });

    it('should treat false as a valid value and not call removeFilterGroup', () => {
      mockFilterModel.getFilterValue.mockReturnValue(false);

      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['active'],
        operator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockFilterModel.getFilterValue).toHaveBeenCalled();
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledWith('filter-1', expect.any(FilterItem));
    });
  });
});
