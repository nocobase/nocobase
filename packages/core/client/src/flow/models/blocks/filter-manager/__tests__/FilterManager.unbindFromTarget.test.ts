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
      saveStepParams: vi.fn().mockResolvedValue(undefined),
    };

    filterManager = new FilterManager(mockGridModel);
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

    it('should not throw error when no configurations exist for the target', async () => {
      // Add a filter config for a different target
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'different-target',
        filterPaths: ['name'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

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

    it('should unbind single filter configuration correctly', async () => {
      // Add a filter config
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      filterManager.unbindFromTarget('target-model-uid');

      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
    });

    it('should unbind multiple filter configurations for the same target', async () => {
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
      const filterConfig3 = {
        filterId: 'filter-3',
        targetId: 'different-target',
        filterPaths: ['status'],
        operator: '$eq',
      };

      await filterManager.addFilterConfig(filterConfig1);
      await filterManager.addFilterConfig(filterConfig2);
      await filterManager.addFilterConfig(filterConfig3);

      filterManager.unbindFromTarget('target-model-uid');

      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledTimes(2);
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenNthCalledWith(1, 'filter-1');
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenNthCalledWith(2, 'filter-2');

      // Should not call removeFilterGroup for filter-3 (different target)
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalledWith('filter-3');
    });

    it('should only unbind configurations for the specified target', async () => {
      // Add filter configs for multiple targets
      const filterConfig1 = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      const filterConfig2 = {
        filterId: 'filter-2',
        targetId: 'other-target-uid',
        filterPaths: ['email'],
        operator: '$contains',
      };

      await filterManager.addFilterConfig(filterConfig1);
      await filterManager.addFilterConfig(filterConfig2);

      filterManager.unbindFromTarget('target-model-uid');

      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledTimes(1);
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');

      // Should not call removeFilterGroup for filter-2 (different target)
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalledWith('filter-2');
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

    it('should work correctly after adding and removing filter configurations', async () => {
      // Add filter config
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-model-uid',
        filterPaths: ['name'],
        operator: '$eq',
      };
      await filterManager.addFilterConfig(filterConfig);

      // Unbind from target
      filterManager.unbindFromTarget('target-model-uid');
      expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');

      // Reset mock
      mockTargetModel.resource.removeFilterGroup.mockClear();

      // Remove the config and try unbind again
      await filterManager.removeFilterConfig({ filterId: 'filter-1' });
      filterManager.unbindFromTarget('target-model-uid');

      // Should not call removeFilterGroup since no configs exist
      expect(mockTargetModel.resource.removeFilterGroup).not.toHaveBeenCalled();
    });

    it('should handle complex configuration scenarios', async () => {
      // Add multiple configs with same filter but different targets
      const filterConfig1 = {
        filterId: 'filter-1',
        targetId: 'target-1',
        filterPaths: ['name'],
        operator: '$eq',
      };
      const filterConfig2 = {
        filterId: 'filter-1',
        targetId: 'target-2',
        filterPaths: ['email'],
        operator: '$contains',
      };

      await filterManager.addFilterConfig(filterConfig1);
      await filterManager.addFilterConfig(filterConfig2);

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
