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
    it('should throw error when targetModelUid is empty string', () => {
      expect(() => {
        filterManager.bindToTarget('');
      }).toThrow('targetModelUid must be a non-empty string');
    });

    it('should throw error when targetModelUid is not a string', () => {
      expect(() => {
        filterManager.bindToTarget(null as any);
      }).toThrow('targetModelUid must be a non-empty string');

      expect(() => {
        filterManager.bindToTarget(undefined as any);
      }).toThrow('targetModelUid must be a non-empty string');

      expect(() => {
        filterManager.bindToTarget(123 as any);
      }).toThrow('targetModelUid must be a non-empty string');
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

    it('should throw error when target model resource addFilterGroup is not a function', () => {
      const mockTargetModel = {
        resource: {
          addFilterGroup: 'not-a-function',
        },
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

      expect(() => {
        filterManager.bindToTarget('target-model-uid');
      }).toThrow('Target model with uid "target-model-uid" does not have a valid resource with addFilterGroup method');
    });
  });

  describe('filter configuration handling', () => {
    let mockTargetModel: any;

    beforeEach(() => {
      mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
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
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
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
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
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
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name', 'email'],
        defaultOperator: '$eq',
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

    it('should use operator over defaultOperator when available', () => {
      // Add a filter config with both operator and defaultOperator
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
        operator: '$ne',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.bindToTarget('target-model-uid');

      expect(mockTargetModel.resource.addFilterGroup).toHaveBeenCalledTimes(1);

      // Verify that the FilterItem uses the operator, not defaultOperator
      const call = mockTargetModel.resource.addFilterGroup.mock.calls[0];
      const filterItem = call[1];
      expect(filterItem.options.operator).toBe('$ne');
    });

    it('should bind multiple filter configurations for the same target', () => {
      // Add multiple filter configs for the same target
      const filterConfig1 = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      const filterConfig2 = {
        filterModelUid: 'filter-2',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['email'],
        defaultOperator: '$contains',
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
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
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
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      const filterConfig2 = {
        filterModelUid: 'filter-2',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['email'],
        defaultOperator: '$contains',
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
});
