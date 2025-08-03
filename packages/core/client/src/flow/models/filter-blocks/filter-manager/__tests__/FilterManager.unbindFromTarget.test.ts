/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterManager } from '../FilterManager';

describe('FilterManager.unbindFromTarget', () => {
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
        filterManager.unbindFromTarget('');
      }).toThrow('targetModelUid must be a non-empty string');
    });

    it('should throw error when targetModelUid is not a string', () => {
      expect(() => {
        filterManager.unbindFromTarget(null as any);
      }).toThrow('targetModelUid must be a non-empty string');

      expect(() => {
        filterManager.unbindFromTarget(undefined as any);
      }).toThrow('targetModelUid must be a non-empty string');

      expect(() => {
        filterManager.unbindFromTarget(123 as any);
      }).toThrow('targetModelUid must be a non-empty string');
    });
  });

  describe('target model validation', () => {
    it('should throw error when target model is not found', () => {
      mockFlowEngine.getModel.mockReturnValue(null);

      expect(() => {
        filterManager.unbindFromTarget('target-model-uid');
      }).toThrow('Target model with uid "target-model-uid" not found');
    });

    it('should throw error when target model does not have resource property', () => {
      const mockTargetModel = {};
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

      expect(() => {
        filterManager.unbindFromTarget('target-model-uid');
      }).toThrow(
        'Target model with uid "target-model-uid" does not have a valid resource with removeFilterGroup method',
      );
    });

    it('should throw error when target model resource does not have removeFilterGroup method', () => {
      const mockTargetModel = {
        resource: {},
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

      expect(() => {
        filterManager.unbindFromTarget('target-model-uid');
      }).toThrow(
        'Target model with uid "target-model-uid" does not have a valid resource with removeFilterGroup method',
      );
    });

    it('should throw error when target model resource removeFilterGroup is not a function', () => {
      const mockTargetModel = {
        resource: {
          removeFilterGroup: 'not-a-function',
        },
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

      expect(() => {
        filterManager.unbindFromTarget('target-model-uid');
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
          removeFilterGroup: vi.fn(),
        },
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);
    });

    it('should return early when no related filter configurations exist', () => {
      // No filter configs in the manager
      filterManager.unbindFromTarget('target-model-uid');

      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
    });

    it('should not throw error when no configurations exist for the target', () => {
      // Add a filter config for a different target
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'different-target',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      expect(() => {
        filterManager.unbindFromTarget('target-model-uid');
      }).not.toThrow();

      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
    });
  });

  describe('successful unbinding', () => {
    let mockTargetModel: any;

    beforeEach(() => {
      mockTargetModel = {
        resource: {
          removeFilterGroup: vi.fn(),
        },
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);
    });

    it('should unbind single filter configuration correctly', () => {
      // Add a filter config
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      filterManager.unbindFromTarget('target-model-uid');

      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
    });

    it('should unbind multiple filter configurations for the same target', () => {
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
      const filterConfig3 = {
        filterModelUid: 'filter-3',
        targetModelUid: 'different-target',
        targetFieldPaths: ['status'],
        defaultOperator: '$eq',
      };

      filterManager.addFilterConfig(filterConfig1);
      filterManager.addFilterConfig(filterConfig2);
      filterManager.addFilterConfig(filterConfig3);

      filterManager.unbindFromTarget('target-model-uid');

      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledTimes(2);
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenNthCalledWith(1, 'filter-1');
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenNthCalledWith(2, 'filter-2');

      // Should not call removeFilterGroup for filter-3 (different target)
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalledWith('filter-3');
    });

    it('should only unbind configurations for the specified target', () => {
      // Add filter configs for multiple targets
      const filterConfig1 = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      const filterConfig2 = {
        filterModelUid: 'filter-2',
        targetModelUid: 'other-target-uid',
        targetFieldPaths: ['email'],
        defaultOperator: '$contains',
      };

      filterManager.addFilterConfig(filterConfig1);
      filterManager.addFilterConfig(filterConfig2);

      filterManager.unbindFromTarget('target-model-uid');

      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');

      // Should not call removeFilterGroup for filter-2 (different target)
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalledWith('filter-2');
    });
  });

  describe('error handling', () => {
    let mockTargetModel: any;

    beforeEach(() => {
      mockTargetModel = {
        resource: {
          removeFilterGroup: vi.fn(),
        },
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);
    });

    it('should throw error when removeFilterGroup method fails', () => {
      // Add a filter config
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      // Make removeFilterGroup throw an error
      const originalError = new Error('Resource error');
      mockTargetModel.resource.removeFilterGroup.mockImplementation(() => {
        throw originalError;
      });

      expect(() => {
        filterManager.unbindFromTarget('target-model-uid');
      }).toThrow('Failed to unbind filter configuration from target model: Resource error');
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

      // Make removeFilterGroup fail for the first call only
      let callCount = 0;
      mockTargetModel.resource.removeFilterGroup.mockImplementation((filterModelUid: string) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First filter removal failed');
        }
      });

      expect(() => {
        filterManager.unbindFromTarget('target-model-uid');
      }).toThrow('Failed to unbind filter configuration from target model: First filter removal failed');

      // Should have attempted to remove the first filter
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
    });

    it('should provide meaningful error messages for different failure scenarios', () => {
      // Add a filter config
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      // Test different types of errors
      const testCases = [
        { error: new Error('Network timeout'), expected: 'Network timeout' },
        { error: new Error('Permission denied'), expected: 'Permission denied' },
        { error: new TypeError('Invalid argument'), expected: 'Invalid argument' },
      ];

      testCases.forEach(({ error, expected }) => {
        mockTargetModel.resource.removeFilterGroup.mockImplementation(() => {
          throw error;
        });

        expect(() => {
          filterManager.unbindFromTarget('target-model-uid');
        }).toThrow(`Failed to unbind filter configuration from target model: ${expected}`);
      });
    });
  });

  describe('integration with other methods', () => {
    let mockTargetModel: any;

    beforeEach(() => {
      mockTargetModel = {
        resource: {
          removeFilterGroup: vi.fn(),
        },
      };
      mockFlowEngine.getModel.mockReturnValue(mockTargetModel);
    });

    it('should work correctly after adding and removing filter configurations', () => {
      // Add filter config
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-model-uid',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      filterManager.addFilterConfig(filterConfig);

      // Unbind from target
      filterManager.unbindFromTarget('target-model-uid');
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');

      // Reset mock
      mockTargetModel.resource.removeFilterGroup.mockClear();

      // Remove the config and try unbind again
      filterManager.removeFilterConfig({ filterModelUid: 'filter-1' });
      filterManager.unbindFromTarget('target-model-uid');

      // Should not call removeFilterGroup since no configs exist
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
    });

    it('should handle complex configuration scenarios', () => {
      // Add multiple configs with same filter but different targets
      const filterConfig1 = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      const filterConfig2 = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-2',
        targetFieldPaths: ['email'],
        defaultOperator: '$contains',
      };

      filterManager.addFilterConfig(filterConfig1);
      filterManager.addFilterConfig(filterConfig2);

      // Mock different target models
      const mockTargetModel2 = {
        resource: {
          removeFilterGroup: vi.fn(),
        },
      };

      mockFlowEngine.getModel.mockImplementation((uid: string) => {
        if (uid === 'target-1') return mockTargetModel;
        if (uid === 'target-2') return mockTargetModel2;
        return null;
      });

      // Unbind from target-1 only
      filterManager.unbindFromTarget('target-1');

      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');

      // Target-2 should not be affected
      expect(mockTargetModel2.resource.removeFilterGroup).not.toHaveBeenCalled();
    });
  });
});
