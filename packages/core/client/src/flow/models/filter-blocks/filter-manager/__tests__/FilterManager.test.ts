/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockGridModel } from '@nocobase/client';
import { FlowEngine } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FILTER_CONFIGS_STEP_KEY, FILTER_MANAGER_FLOW_KEY, FilterManager } from '../FilterManager';

// Mock FlowModel
const mockFlowModel = {
  getStepParams: vi.fn(),
  setStepParams: vi.fn(),
  save: vi.fn(),
  saveStepParams: vi.fn(),
  flowEngine: {
    getModel: vi.fn(),
  },
};

describe('FilterManager', () => {
  let filterManager: FilterManager;

  beforeEach(() => {
    vi.clearAllMocks();
    filterManager = new FilterManager(mockFlowModel as any, []);
  });

  describe('constructor', () => {
    it('should initialize with empty array when no step params exist', () => {
      filterManager = new FilterManager(mockFlowModel as any);

      const result = filterManager.getConnectFieldsConfig('test');
      expect(result).toBeUndefined();
    });

    it('should initialize with existing filter configs', () => {
      const existingConfigs = [
        {
          filterId: 'filter1',
          targetId: 'target1',
          filterPaths: ['field1'],
        },
      ];

      filterManager = new FilterManager(mockFlowModel as any, existingConfigs);

      const result = filterManager.getConnectFieldsConfig('filter1');
      expect(result).toEqual({
        targets: [
          {
            targetId: 'target1',
            filterPaths: ['field1'],
          },
        ],
      });
    });
  });

  describe('saveFilterConfigs', () => {
    it('should call setStepParams with correct parameters', async () => {
      await filterManager.saveFilterConfigs();

      expect(mockFlowModel.saveStepParams).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConnectFieldsConfig', () => {
    beforeEach(() => {
      const mockConfigs = [
        {
          filterId: 'filter1',
          targetId: 'target1',
          filterPaths: ['field1'],
          operator: 'eq',
        },
        {
          filterId: 'filter1',
          targetId: 'target2',
          filterPaths: ['field2'],
          operator: 'eq',
        },
        {
          filterId: 'filter2',
          targetId: 'target3',
          filterPaths: ['field3'],
          operator: 'ne',
        },
      ];
      filterManager = new FilterManager(mockFlowModel as any, mockConfigs);
    });

    it('should return undefined when no configs found for filterId', () => {
      const result = filterManager.getConnectFieldsConfig('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should return correct ConnectFieldsConfig for existing filterId', () => {
      const result = filterManager.getConnectFieldsConfig('filter1');

      expect(result).toEqual({
        targets: [
          {
            targetId: 'target1',
            filterPaths: ['field1'],
          },
          {
            targetId: 'target2',
            filterPaths: ['field2'],
          },
        ],
      });
    });

    it('should return correct ConnectFieldsConfig for single target', () => {
      const result = filterManager.getConnectFieldsConfig('filter2');

      expect(result).toEqual({
        targets: [
          {
            targetId: 'target3',
            filterPaths: ['field3'],
          },
        ],
      });
    });
  });

  describe('saveConnectFieldsConfig', () => {
    it('should save new config correctly', async () => {
      const config = {
        targets: [
          {
            targetId: 'target1',
            filterPaths: ['name'],
          },
          {
            targetId: 'target2',
            filterPaths: ['title'],
          },
        ],
      };

      await filterManager.saveConnectFieldsConfig('filter1', config);

      expect(filterManager.getFilterConfigs()).toEqual([
        {
          filterId: 'filter1',
          targetId: 'target1',
          filterPaths: ['name'],
        },
        {
          filterId: 'filter1',
          targetId: 'target2',
          filterPaths: ['title'],
        },
      ]);
    });

    it('should replace existing config for same filterId', async () => {
      // Initialize with existing config
      const initialConfigs = [
        {
          filterId: 'filter1',
          targetId: 'oldTarget',
          filterPaths: ['oldField'],
          operator: 'eq',
        },
        {
          filterId: 'filter2',
          targetId: 'target2',
          filterPaths: ['field2'],
          operator: 'ne',
        },
      ];
      filterManager = new FilterManager(mockFlowModel as any, initialConfigs);

      const newConfig = {
        targets: [
          {
            targetId: 'newTarget',
            filterPaths: ['newField'],
          },
        ],
      };

      await filterManager.saveConnectFieldsConfig('filter1', newConfig);

      expect(filterManager.getFilterConfigs()).toEqual([
        {
          filterId: 'filter2',
          targetId: 'target2',
          filterPaths: ['field2'],
          operator: 'ne',
        },
        {
          filterId: 'filter1',
          targetId: 'newTarget',
          filterPaths: ['newField'],
        },
      ]);
    });
  });

  describe('model.serialize', () => {
    it('should return correct serialized object', async () => {
      const engine = new FlowEngine();
      engine.registerModels({ BlockGridModel });
      const filterConfig1 = {
        filterId: 'filter-1',
        targetId: 'target-1',
        filterPaths: ['name'],
        operator: '$eq',
      };
      const model = engine.createModel<BlockGridModel>({ use: 'BlockGridModel', filterManager: [filterConfig1] });
      const filterConfig2 = {
        filterId: 'filter-2',
        targetId: 'target-2',
        filterPaths: ['name'],
        operator: '$eq',
      };
      await model.filterManager.addFilterConfig(filterConfig2);
      const data = model.serialize();
      expect(data.filterManager).toEqual([filterConfig1, filterConfig2]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty targets in saveConnectFieldsConfig', async () => {
      const config = {
        targets: [],
      };

      await filterManager.saveConnectFieldsConfig('filter1', config);

      expect(filterManager.getFilterConfigs()).toEqual([]);
    });
  });

  describe('addFilterConfig', () => {
    it('should add a new filter config successfully', async () => {
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-1',
        filterPaths: ['name'],
        operator: '$eq',
      };

      await filterManager.addFilterConfig(filterConfig);

      expect(filterManager.getFilterConfigs()).toEqual([filterConfig]);
      expect(mockFlowModel.saveStepParams).toHaveBeenCalled();
    });

    it('should update existing filter config with same filterId and targetId', async () => {
      // Setup initial config
      const initialConfig = {
        filterId: 'filter-1',
        targetId: 'target-1',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager = new FilterManager(mockFlowModel as any, [initialConfig]);

      // Add updated config
      const updatedConfig = {
        filterId: 'filter-1',
        targetId: 'target-1',
        filterPaths: ['email'],
        operator: '$contains',
      };

      await filterManager.addFilterConfig(updatedConfig);

      expect(filterManager.getFilterConfigs()).toEqual([updatedConfig]);
      expect(mockFlowModel.saveStepParams).toHaveBeenCalled();
    });

    it('should add multiple different filter configs', async () => {
      const config1 = {
        filterId: 'filter-1',
        targetId: 'target-1',
        filterPaths: ['name'],
        operator: '$eq',
      };

      const config2 = {
        filterId: 'filter-2',
        targetId: 'target-2',
        filterPaths: ['email'],
        operator: '$ne',
      };

      await filterManager.addFilterConfig(config1);
      await filterManager.addFilterConfig(config2);

      expect(filterManager.getFilterConfigs()).toEqual([config1, config2]);
    });

    it('should throw error when filterId is missing', async () => {
      const filterConfig = {
        filterId: '',
        targetId: 'target-1',
        filterPaths: ['name'],
        operator: '$eq',
      };

      await expect(filterManager.addFilterConfig(filterConfig)).rejects.toThrow(
        'FilterConfig must have filterId, targetId, and operator',
      );
    });

    it('should throw error when targetId is missing', async () => {
      const filterConfig = {
        filterId: 'filter-1',
        targetId: '',
        filterPaths: ['name'],
        operator: '$eq',
      };

      await expect(filterManager.addFilterConfig(filterConfig)).rejects.toThrow(
        'FilterConfig must have filterId, targetId, and operator',
      );
    });

    it('should throw error when filterPaths is empty array', async () => {
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-1',
        filterPaths: [],
        operator: '$eq',
      };

      await expect(filterManager.addFilterConfig(filterConfig)).rejects.toThrow(
        'FilterConfig must have non-empty filterPaths array',
      );
    });

    it('should throw error when filterPaths is not an array', async () => {
      const filterConfig = {
        filterId: 'filter-1',
        targetId: 'target-1',
        filterPaths: 'name' as any,
        operator: '$eq',
      };

      await expect(filterManager.addFilterConfig(filterConfig)).rejects.toThrow(
        'FilterConfig must have non-empty filterPaths array',
      );
    });

    it('should add config when same filterId exists but different targetId', async () => {
      // Setup initial config
      const initialConfig = {
        filterId: 'filter-1',
        targetId: 'target-1',
        filterPaths: ['name'],
        operator: '$eq',
      };
      filterManager = new FilterManager(mockFlowModel as any, [initialConfig]);

      // Add config with same filter but different target
      const newConfig = {
        filterId: 'filter-1',
        targetId: 'target-2',
        filterPaths: ['email'],
        operator: '$ne',
      };

      await filterManager.addFilterConfig(newConfig);

      expect(filterManager.getFilterConfigs()).toEqual([initialConfig, newConfig]);
    });
  });

  describe('removeFilterConfig', () => {
    beforeEach(() => {
      // Setup initial filter configs for testing removal
      const initialConfigs = [
        {
          filterId: 'filter-1',
          targetId: 'target-1',
          filterPaths: ['name'],
          operator: '$eq',
        },
        {
          filterId: 'filter-1',
          targetId: 'target-2',
          filterPaths: ['age'],
          operator: '$gt',
        },
        {
          filterId: 'filter-2',
          targetId: 'target-1',
          filterPaths: ['email'],
          operator: '$like',
        },
        {
          filterId: 'filter-2',
          targetId: 'target-3',
          filterPaths: ['status'],
          operator: '$eq',
        },
      ];
      filterManager = new FilterManager(mockFlowModel as any, initialConfigs);
    });

    it('should throw error when no parameters provided', async () => {
      await expect(filterManager.removeFilterConfig({})).rejects.toThrow(
        'At least one of filterId or targetId must be provided',
      );
    });

    it('should remove all configs for a specific filter when only filterId provided', async () => {
      const removedCount = await filterManager.removeFilterConfig({ filterId: 'filter-1' });

      expect(removedCount).toBe(2);
      expect(mockFlowModel.saveStepParams).toHaveBeenCalled();
    });

    it('should remove all configs for a specific target when only targetId provided', async () => {
      const removedCount = await filterManager.removeFilterConfig({ targetId: 'target-1' });

      expect(removedCount).toBe(2);
      expect(mockFlowModel.saveStepParams).toHaveBeenCalled();
    });

    it('should remove specific config when both filterId and targetId provided', async () => {
      const removedCount = await filterManager.removeFilterConfig({
        filterId: 'filter-1',
        targetId: 'target-2',
      });

      expect(removedCount).toBe(1);
      expect(mockFlowModel.saveStepParams).toHaveBeenCalled();
    });

    it('should return 0 when no matching configs found', async () => {
      const removedCount = await filterManager.removeFilterConfig({ filterId: 'non-existent' });

      expect(removedCount).toBe(0);
      expect(mockFlowModel.saveStepParams).not.toHaveBeenCalled();
    });

    it('should not save when no configs are removed', async () => {
      const removedCount = await filterManager.removeFilterConfig({ targetId: 'non-existent' });

      expect(removedCount).toBe(0);
      expect(mockFlowModel.saveStepParams).not.toHaveBeenCalled();
    });

    it('should handle empty filterConfigs array', async () => {
      const emptyFilterManager = new FilterManager(mockFlowModel as any, []);

      const removedCount = await emptyFilterManager.removeFilterConfig({ filterId: 'filter-1' });

      expect(removedCount).toBe(0);
      expect(mockFlowModel.saveStepParams).not.toHaveBeenCalled();
    });

    it('should remove all remaining configs when removing by existing targetId', async () => {
      // First remove some configs to make the array smaller
      await filterManager.removeFilterConfig({ filterId: 'filter-1' });

      // Reset mocks to track the next call
      vi.clearAllMocks();

      // Now remove by target
      const removedCount = await filterManager.removeFilterConfig({ targetId: 'target-3' });

      expect(removedCount).toBe(1);
      expect(mockFlowModel.saveStepParams).toHaveBeenCalled();
    });

    it('should preserve other configs when removing specific combination', async () => {
      const removedCount = await filterManager.removeFilterConfig({
        filterId: 'filter-2',
        targetId: 'target-1',
      });

      expect(removedCount).toBe(1);
    });
  });

  describe('refreshTargetsByFilter', () => {
    it('should throw error when filterId is not provided', async () => {
      await expect(filterManager.refreshTargetsByFilter('')).rejects.toThrow('filterId must be provided');
      await expect(filterManager.refreshTargetsByFilter(null as any)).rejects.toThrow('filterId must be provided');
      await expect(filterManager.refreshTargetsByFilter(undefined as any)).rejects.toThrow('filterId must be provided');
    });

    it('should throw error when filterId array contains invalid values', async () => {
      await expect(filterManager.refreshTargetsByFilter([])).rejects.toThrow('filterId must be non-empty string(s)');
      await expect(filterManager.refreshTargetsByFilter(['', 'valid'])).rejects.toThrow(
        'filterId must be non-empty string(s)',
      );
      await expect(filterManager.refreshTargetsByFilter([null as any, 'valid'])).rejects.toThrow(
        'filterId must be non-empty string(s)',
      );
    });

    it('should return early when no related configs found', async () => {
      // No filter configs exist
      await expect(filterManager.refreshTargetsByFilter('filter-1')).resolves.toBeUndefined();
      expect(mockFlowModel.flowEngine.getModel).not.toHaveBeenCalled();
    });

    it('should process single filterId successfully', async () => {
      // Setup filter configs
      const filterConfigs = [
        {
          filterId: 'filter-1',
          targetId: 'target-1',
          filterPaths: ['name'],
          operator: '$eq',
        },
        {
          filterId: 'filter-1',
          targetId: 'target-2',
          filterPaths: ['title'],
          operator: '$eq',
        },
      ];

      // Mock private property
      (filterManager as any).filterConfigs = filterConfigs;

      // Mock target models with refresh method
      const mockTargetModel1 = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
          refresh: vi.fn().mockResolvedValue(undefined),
        },
      };

      const mockTargetModel2 = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
          refresh: vi.fn().mockResolvedValue(undefined),
        },
      };

      const mockFilterModel = {
        getFilterValue: vi.fn().mockReturnValue('test-value'),
      };

      (mockFlowModel.flowEngine.getModel as any).mockImplementation((uid: string) => {
        if (uid === 'target-1') return mockTargetModel1;
        if (uid === 'target-2') return mockTargetModel2;
        if (uid === 'filter-1') return mockFilterModel;
        return null;
      });

      await filterManager.refreshTargetsByFilter('filter-1');

      // Verify both target models were refreshed
      expect(mockTargetModel1.resource.refresh).toHaveBeenCalledTimes(1);
      expect(mockTargetModel2.resource.refresh).toHaveBeenCalledTimes(1);
    });

    it('should process multiple filterIds successfully', async () => {
      // Setup filter configs
      const filterConfigs = [
        {
          filterId: 'filter-1',
          targetId: 'target-1',
          filterPaths: ['name'],
          operator: '$eq',
        },
        {
          filterId: 'filter-2',
          targetId: 'target-1', // Same target for different filters
          filterPaths: ['title'],
          operator: '$eq',
        },
        {
          filterId: 'filter-2',
          targetId: 'target-2',
          filterPaths: ['description'],
          operator: '$eq',
        },
      ];

      // Mock private property
      (filterManager as any).filterConfigs = filterConfigs;

      // Mock target models
      const mockTargetModel1 = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
          refresh: vi.fn().mockResolvedValue(undefined),
        },
      };

      const mockTargetModel2 = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
          refresh: vi.fn().mockResolvedValue(undefined),
        },
      };

      const mockFilterModel = {
        getFilterValue: vi.fn().mockReturnValue('test-value'),
      };

      (mockFlowModel.flowEngine.getModel as any).mockImplementation((uid: string) => {
        if (uid === 'target-1') return mockTargetModel1;
        if (uid === 'target-2') return mockTargetModel2;
        if (uid === 'filter-1' || uid === 'filter-2') return mockFilterModel;
        return null;
      });

      await filterManager.refreshTargetsByFilter(['filter-1', 'filter-2']);

      // Verify both target models were refreshed (target-1 should be refreshed only once despite having multiple filters)
      expect(mockTargetModel1.resource.refresh).toHaveBeenCalledTimes(1);
      expect(mockTargetModel2.resource.refresh).toHaveBeenCalledTimes(1);
    });

    it('should throw error when target model not found', async () => {
      // Setup filter configs
      const filterConfigs = [
        {
          filterId: 'filter-1',
          targetId: 'target-1',
          filterPaths: ['name'],
          operator: '$eq',
        },
      ];

      (filterManager as any).filterConfigs = filterConfigs;

      // Mock filter model but return null for target models
      const mockFilterModel = {
        getFilterValue: vi.fn().mockReturnValue('test-value'),
      };

      (mockFlowModel.flowEngine.getModel as any).mockImplementation((uid: string) => {
        if (uid === 'filter-1') return mockFilterModel;
        return null; // target model not found
      });

      await expect(filterManager.refreshTargetsByFilter('filter-1')).rejects.toThrow(
        'Failed to refresh target model "target-1": Target model with uid "target-1" not found',
      );
    });

    it('should throw error when target model lacks refresh method', async () => {
      // Setup filter configs
      const filterConfigs = [
        {
          filterId: 'filter-1',
          targetId: 'target-1',
          filterPaths: ['name'],
          operator: '$eq',
        },
      ];

      (filterManager as any).filterConfigs = filterConfigs;

      // Mock target model without refresh method
      const mockTargetModelInvalid = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
          // Missing refresh method
        },
      };

      const mockFilterModel = {
        getFilterValue: vi.fn().mockReturnValue('test-value'),
      };

      (mockFlowModel.flowEngine.getModel as any).mockImplementation((uid: string) => {
        if (uid === 'target-1') return mockTargetModelInvalid;
        if (uid === 'filter-1') return mockFilterModel;
        return null;
      });

      await expect(filterManager.refreshTargetsByFilter('filter-1')).rejects.toThrow(
        'Failed to refresh target model "target-1": Target model with uid "target-1" does not have a valid resource with refresh method',
      );
    });

    it('should handle refresh method failures gracefully', async () => {
      // Setup filter configs
      const filterConfigs = [
        {
          filterId: 'filter-1',
          targetId: 'target-1',
          filterPaths: ['name'],
          operator: '$eq',
        },
      ];

      (filterManager as any).filterConfigs = filterConfigs;

      // Mock target model with failing refresh method
      const mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
          refresh: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      };

      const mockFilterModel = {
        getFilterValue: vi.fn().mockReturnValue('test-value'),
      };

      (mockFlowModel.flowEngine.getModel as any).mockImplementation((uid: string) => {
        if (uid === 'target-1') return mockTargetModel;
        if (uid === 'filter-1') return mockFilterModel;
        return null;
      });

      await expect(filterManager.refreshTargetsByFilter('filter-1')).rejects.toThrow(
        'Failed to refresh target model "target-1": Network error',
      );
    });

    it('should deduplicate target model UIDs correctly', async () => {
      // Setup filter configs with duplicate target UIDs
      const filterConfigs = [
        {
          filterId: 'filter-1',
          targetId: 'target-1',
          filterPaths: ['name'],
          operator: '$eq',
        },
        {
          filterId: 'filter-1',
          targetId: 'target-1', // Duplicate target
          filterPaths: ['email'],
          operator: '$eq',
        },
        {
          filterId: 'filter-1',
          targetId: 'target-2',
          filterPaths: ['title'],
          operator: '$eq',
        },
      ];

      (filterManager as any).filterConfigs = filterConfigs;

      const mockTargetModel1 = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
          refresh: vi.fn().mockResolvedValue(undefined),
        },
      };

      const mockTargetModel2 = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
          refresh: vi.fn().mockResolvedValue(undefined),
        },
      };

      const mockFilterModel = {
        getFilterValue: vi.fn().mockReturnValue('test-value'),
      };

      (mockFlowModel.flowEngine.getModel as any).mockImplementation((uid: string) => {
        if (uid === 'target-1') return mockTargetModel1;
        if (uid === 'target-2') return mockTargetModel2;
        if (uid === 'filter-1') return mockFilterModel;
        return null;
      });

      await filterManager.refreshTargetsByFilter('filter-1');

      // Each target model should be refreshed only once despite duplicate configs
      expect(mockTargetModel1.resource.refresh).toHaveBeenCalledTimes(1);
      expect(mockTargetModel2.resource.refresh).toHaveBeenCalledTimes(1);
    });

    it('should handle bindToTarget errors correctly', async () => {
      // Setup filter configs
      const filterConfigs = [
        {
          filterId: 'filter-1',
          targetId: 'target-1',
          filterPaths: ['name'],
          operator: '$eq',
        },
      ];

      (filterManager as any).filterConfigs = filterConfigs;

      // Mock target model that exists but filter model that doesn't
      const mockTargetModel = {
        resource: {
          addFilterGroup: vi.fn(),
          removeFilterGroup: vi.fn(),
          refresh: vi.fn().mockResolvedValue(undefined),
        },
      };

      (mockFlowModel.flowEngine.getModel as any).mockImplementation((uid: string) => {
        if (uid === 'target-1') return mockTargetModel;
        return null; // filter model not found
      });

      await expect(filterManager.refreshTargetsByFilter('filter-1')).rejects.toThrow(
        'Failed to refresh target model "target-1"',
      );
    });
  });
});
