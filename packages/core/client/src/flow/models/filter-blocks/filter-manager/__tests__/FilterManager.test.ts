/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FILTER_CONFIGS_STEP_KEY, FILTER_MANAGER_FLOW_KEY, FilterManager } from '../FilterManager';

// Mock FlowModel
const mockFlowModel = {
  getStepParams: vi.fn(),
  setStepParams: vi.fn(),
  save: vi.fn(),
  flowEngine: {
    getModel: vi.fn(),
  },
};

describe('FilterManager', () => {
  let filterManager: FilterManager;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFlowModel.getStepParams.mockReturnValue([]);
    filterManager = new FilterManager(mockFlowModel as any);
  });

  describe('constructor', () => {
    it('should initialize with empty array when no step params exist', () => {
      mockFlowModel.getStepParams.mockReturnValue(undefined);
      filterManager = new FilterManager(mockFlowModel as any);

      expect(mockFlowModel.getStepParams).toHaveBeenCalledWith(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY);
      // 验证可以正常获取配置（应该返回 undefined，因为没有配置）
      const result = filterManager.getConnectFieldsConfig('test');
      expect(result).toBeUndefined();
    });

    it('should initialize with existing filter configs', () => {
      const existingConfigs = [
        {
          filterModelUid: 'filter1',
          targetModelUid: 'target1',
          targetFieldPaths: ['field1'],
          defaultOperator: '$eq',
        },
      ];
      mockFlowModel.getStepParams.mockReturnValue(existingConfigs);

      filterManager = new FilterManager(mockFlowModel as any);

      expect(mockFlowModel.getStepParams).toHaveBeenCalledWith(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY);
      // 验证可以正常获取配置
      const result = filterManager.getConnectFieldsConfig('filter1');
      expect(result).toEqual({
        operator: '$eq',
        targets: [
          {
            targetModelUid: 'target1',
            targetFieldPaths: ['field1'],
          },
        ],
      });
    });
  });

  describe('saveFilterConfigs', () => {
    it('should call setStepParams with correct parameters', () => {
      filterManager.saveFilterConfigs();

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith(
        FILTER_MANAGER_FLOW_KEY,
        FILTER_CONFIGS_STEP_KEY,
        expect.any(Array),
      );
      expect(mockFlowModel.setStepParams).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConnectFieldsConfig', () => {
    beforeEach(() => {
      const mockConfigs = [
        {
          filterModelUid: 'filter1',
          targetModelUid: 'target1',
          targetFieldPaths: ['field1'],
          defaultOperator: 'eq',
        },
        {
          filterModelUid: 'filter1',
          targetModelUid: 'target2',
          targetFieldPaths: ['field2'],
          defaultOperator: 'eq',
        },
        {
          filterModelUid: 'filter2',
          targetModelUid: 'target3',
          targetFieldPaths: ['field3'],
          defaultOperator: 'ne',
        },
      ];
      mockFlowModel.getStepParams.mockReturnValue(mockConfigs);
      filterManager = new FilterManager(mockFlowModel as any);
    });

    it('should return undefined when no configs found for filterModelUid', () => {
      const result = filterManager.getConnectFieldsConfig('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should return correct ConnectFieldsConfig for existing filterModelUid', () => {
      const result = filterManager.getConnectFieldsConfig('filter1');

      expect(result).toEqual({
        operator: 'eq',
        targets: [
          {
            targetModelUid: 'target1',
            targetFieldPaths: ['field1'],
          },
          {
            targetModelUid: 'target2',
            targetFieldPaths: ['field2'],
          },
        ],
      });
    });

    it('should return correct ConnectFieldsConfig for single target', () => {
      const result = filterManager.getConnectFieldsConfig('filter2');

      expect(result).toEqual({
        operator: 'ne',
        targets: [
          {
            targetModelUid: 'target3',
            targetFieldPaths: ['field3'],
          },
        ],
      });
    });
  });

  describe('saveConnectFieldsConfig', () => {
    it('should save new config correctly', () => {
      const config = {
        operator: 'contains',
        targets: [
          {
            targetModelUid: 'target1',
            targetFieldPaths: ['name'],
          },
          {
            targetModelUid: 'target2',
            targetFieldPaths: ['title'],
          },
        ],
      };

      filterManager.saveConnectFieldsConfig('filter1', config);

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY, [
        {
          filterModelUid: 'filter1',
          targetModelUid: 'target1',
          targetFieldPaths: ['name'],
          defaultOperator: 'contains',
        },
        {
          filterModelUid: 'filter1',
          targetModelUid: 'target2',
          targetFieldPaths: ['title'],
          defaultOperator: 'contains',
        },
      ]);
    });

    it('should replace existing config for same filterModelUid', () => {
      // Initialize with existing config
      const initialConfigs = [
        {
          filterModelUid: 'filter1',
          targetModelUid: 'oldTarget',
          targetFieldPaths: ['oldField'],
          defaultOperator: 'eq',
        },
        {
          filterModelUid: 'filter2',
          targetModelUid: 'target2',
          targetFieldPaths: ['field2'],
          defaultOperator: 'ne',
        },
      ];
      mockFlowModel.getStepParams.mockReturnValue(initialConfigs);
      filterManager = new FilterManager(mockFlowModel as any);

      const newConfig = {
        operator: 'contains',
        targets: [
          {
            targetModelUid: 'newTarget',
            targetFieldPaths: ['newField'],
          },
        ],
      };

      filterManager.saveConnectFieldsConfig('filter1', newConfig);

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY, [
        {
          filterModelUid: 'filter2',
          targetModelUid: 'target2',
          targetFieldPaths: ['field2'],
          defaultOperator: 'ne',
        },
        {
          filterModelUid: 'filter1',
          targetModelUid: 'newTarget',
          targetFieldPaths: ['newField'],
          defaultOperator: 'contains',
        },
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty targets in saveConnectFieldsConfig', () => {
      const config = {
        operator: 'eq',
        targets: [],
      };

      filterManager.saveConnectFieldsConfig('filter1', config);

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY, []);
    });
  });

  describe('addFilterConfig', () => {
    it('should add a new filter config successfully', () => {
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };

      filterManager.addFilterConfig(filterConfig);

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY, [
        filterConfig,
      ]);
      expect(mockFlowModel.save).toHaveBeenCalled();
    });

    it('should update existing filter config with same filterModelUid and targetModelUid', () => {
      // Setup initial config
      const initialConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      mockFlowModel.getStepParams.mockReturnValue([initialConfig]);
      filterManager = new FilterManager(mockFlowModel as any);

      // Add updated config
      const updatedConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['email'],
        defaultOperator: '$ne',
        operator: '$contains',
      };

      filterManager.addFilterConfig(updatedConfig);

      expect(mockFlowModel.setStepParams).toHaveBeenLastCalledWith(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY, [
        updatedConfig,
      ]);
      expect(mockFlowModel.save).toHaveBeenCalled();
    });

    it('should add multiple different filter configs', () => {
      const config1 = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };

      const config2 = {
        filterModelUid: 'filter-2',
        targetModelUid: 'target-2',
        targetFieldPaths: ['email'],
        defaultOperator: '$ne',
      };

      filterManager.addFilterConfig(config1);
      filterManager.addFilterConfig(config2);

      expect(mockFlowModel.setStepParams).toHaveBeenLastCalledWith(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY, [
        config1,
        config2,
      ]);
    });

    it('should throw error when filterModelUid is missing', () => {
      const filterConfig = {
        filterModelUid: '',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };

      expect(() => filterManager.addFilterConfig(filterConfig)).toThrow(
        'FilterConfig must have filterModelUid, targetModelUid, and defaultOperator',
      );
    });

    it('should throw error when targetModelUid is missing', () => {
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: '',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };

      expect(() => filterManager.addFilterConfig(filterConfig)).toThrow(
        'FilterConfig must have filterModelUid, targetModelUid, and defaultOperator',
      );
    });

    it('should throw error when defaultOperator is missing', () => {
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '',
      };

      expect(() => filterManager.addFilterConfig(filterConfig)).toThrow(
        'FilterConfig must have filterModelUid, targetModelUid, and defaultOperator',
      );
    });

    it('should throw error when targetFieldPaths is empty array', () => {
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: [],
        defaultOperator: '$eq',
      };

      expect(() => filterManager.addFilterConfig(filterConfig)).toThrow(
        'FilterConfig must have non-empty targetFieldPaths array',
      );
    });

    it('should throw error when targetFieldPaths is not an array', () => {
      const filterConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: 'name' as any,
        defaultOperator: '$eq',
      };

      expect(() => filterManager.addFilterConfig(filterConfig)).toThrow(
        'FilterConfig must have non-empty targetFieldPaths array',
      );
    });

    it('should add config when same filterModelUid exists but different targetModelUid', () => {
      // Setup initial config
      const initialConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      };
      mockFlowModel.getStepParams.mockReturnValue([initialConfig]);
      filterManager = new FilterManager(mockFlowModel as any);

      // Add config with same filter but different target
      const newConfig = {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-2',
        targetFieldPaths: ['email'],
        defaultOperator: '$ne',
      };

      filterManager.addFilterConfig(newConfig);

      expect(mockFlowModel.setStepParams).toHaveBeenLastCalledWith(FILTER_MANAGER_FLOW_KEY, FILTER_CONFIGS_STEP_KEY, [
        initialConfig,
        newConfig,
      ]);
    });
  });

  describe('removeFilterConfig', () => {
    beforeEach(() => {
      // Setup initial filter configs for testing removal
      const initialConfigs = [
        {
          filterModelUid: 'filter-1',
          targetModelUid: 'target-1',
          targetFieldPaths: ['name'],
          defaultOperator: '$eq',
        },
        {
          filterModelUid: 'filter-1',
          targetModelUid: 'target-2',
          targetFieldPaths: ['age'],
          defaultOperator: '$gt',
        },
        {
          filterModelUid: 'filter-2',
          targetModelUid: 'target-1',
          targetFieldPaths: ['email'],
          defaultOperator: '$like',
        },
        {
          filterModelUid: 'filter-2',
          targetModelUid: 'target-3',
          targetFieldPaths: ['status'],
          defaultOperator: '$eq',
        },
      ];
      mockFlowModel.getStepParams.mockReturnValue(initialConfigs);
      filterManager = new FilterManager(mockFlowModel as any);
    });

    it('should throw error when no parameters provided', () => {
      expect(() => {
        filterManager.removeFilterConfig({});
      }).toThrow('At least one of filterModelUid or targetModelUid must be provided');
    });

    it('should remove all configs for a specific filter when only filterModelUid provided', () => {
      const removedCount = filterManager.removeFilterConfig({ filterModelUid: 'filter-1' });

      expect(removedCount).toBe(2);
      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith(
        FILTER_MANAGER_FLOW_KEY,
        FILTER_CONFIGS_STEP_KEY,
        expect.arrayContaining([
          expect.objectContaining({ filterModelUid: 'filter-2', targetModelUid: 'target-1' }),
          expect.objectContaining({ filterModelUid: 'filter-2', targetModelUid: 'target-3' }),
        ]),
      );
      expect(mockFlowModel.save).toHaveBeenCalled();
    });

    it('should remove all configs for a specific target when only targetModelUid provided', () => {
      const removedCount = filterManager.removeFilterConfig({ targetModelUid: 'target-1' });

      expect(removedCount).toBe(2);
      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith(
        FILTER_MANAGER_FLOW_KEY,
        FILTER_CONFIGS_STEP_KEY,
        expect.arrayContaining([
          expect.objectContaining({ filterModelUid: 'filter-1', targetModelUid: 'target-2' }),
          expect.objectContaining({ filterModelUid: 'filter-2', targetModelUid: 'target-3' }),
        ]),
      );
      expect(mockFlowModel.save).toHaveBeenCalled();
    });

    it('should remove specific config when both filterModelUid and targetModelUid provided', () => {
      const removedCount = filterManager.removeFilterConfig({
        filterModelUid: 'filter-1',
        targetModelUid: 'target-2',
      });

      expect(removedCount).toBe(1);
      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith(
        FILTER_MANAGER_FLOW_KEY,
        FILTER_CONFIGS_STEP_KEY,
        expect.arrayContaining([
          expect.objectContaining({ filterModelUid: 'filter-1', targetModelUid: 'target-1' }),
          expect.objectContaining({ filterModelUid: 'filter-2', targetModelUid: 'target-1' }),
          expect.objectContaining({ filterModelUid: 'filter-2', targetModelUid: 'target-3' }),
        ]),
      );
      expect(mockFlowModel.save).toHaveBeenCalled();
    });

    it('should return 0 when no matching configs found', () => {
      const removedCount = filterManager.removeFilterConfig({ filterModelUid: 'non-existent' });

      expect(removedCount).toBe(0);
      expect(mockFlowModel.setStepParams).not.toHaveBeenCalled();
      expect(mockFlowModel.save).not.toHaveBeenCalled();
    });

    it('should not save when no configs are removed', () => {
      const removedCount = filterManager.removeFilterConfig({ targetModelUid: 'non-existent' });

      expect(removedCount).toBe(0);
      expect(mockFlowModel.setStepParams).not.toHaveBeenCalled();
      expect(mockFlowModel.save).not.toHaveBeenCalled();
    });

    it('should handle empty filterConfigs array', () => {
      mockFlowModel.getStepParams.mockReturnValue([]);
      const emptyFilterManager = new FilterManager(mockFlowModel as any);

      const removedCount = emptyFilterManager.removeFilterConfig({ filterModelUid: 'filter-1' });

      expect(removedCount).toBe(0);
      expect(mockFlowModel.setStepParams).not.toHaveBeenCalled();
      expect(mockFlowModel.save).not.toHaveBeenCalled();
    });

    it('should remove all remaining configs when removing by existing targetModelUid', () => {
      // First remove some configs to make the array smaller
      filterManager.removeFilterConfig({ filterModelUid: 'filter-1' });

      // Reset mocks to track the next call
      vi.clearAllMocks();

      // Now remove by target
      const removedCount = filterManager.removeFilterConfig({ targetModelUid: 'target-3' });

      expect(removedCount).toBe(1);
      expect(mockFlowModel.save).toHaveBeenCalled();
    });

    it('should preserve other configs when removing specific combination', () => {
      const removedCount = filterManager.removeFilterConfig({
        filterModelUid: 'filter-2',
        targetModelUid: 'target-1',
      });

      expect(removedCount).toBe(1);

      const savedConfigs = mockFlowModel.setStepParams.mock.calls[0][2];
      expect(savedConfigs).toHaveLength(3);
      expect(savedConfigs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ filterModelUid: 'filter-1', targetModelUid: 'target-1' }),
          expect.objectContaining({ filterModelUid: 'filter-1', targetModelUid: 'target-2' }),
          expect.objectContaining({ filterModelUid: 'filter-2', targetModelUid: 'target-3' }),
        ]),
      );
    });
  });

  describe('refreshTargetsByFilter', () => {
    it('should throw error when filterModelUid is not provided', async () => {
      await expect(filterManager.refreshTargetsByFilter('')).rejects.toThrow('filterModelUid must be provided');
      await expect(filterManager.refreshTargetsByFilter(null as any)).rejects.toThrow(
        'filterModelUid must be provided',
      );
      await expect(filterManager.refreshTargetsByFilter(undefined as any)).rejects.toThrow(
        'filterModelUid must be provided',
      );
    });

    it('should throw error when filterModelUid array contains invalid values', async () => {
      await expect(filterManager.refreshTargetsByFilter([])).rejects.toThrow(
        'filterModelUid must be non-empty string(s)',
      );
      await expect(filterManager.refreshTargetsByFilter(['', 'valid'])).rejects.toThrow(
        'filterModelUid must be non-empty string(s)',
      );
      await expect(filterManager.refreshTargetsByFilter([null as any, 'valid'])).rejects.toThrow(
        'filterModelUid must be non-empty string(s)',
      );
    });

    it('should return early when no related configs found', async () => {
      // No filter configs exist
      await expect(filterManager.refreshTargetsByFilter('filter-1')).resolves.toBeUndefined();
      expect(mockFlowModel.flowEngine.getModel).not.toHaveBeenCalled();
    });

    it('should process single filterModelUid successfully', async () => {
      // Setup filter configs
      const filterConfigs = [
        {
          filterModelUid: 'filter-1',
          targetModelUid: 'target-1',
          targetFieldPaths: ['name'],
          defaultOperator: '$eq',
        },
        {
          filterModelUid: 'filter-1',
          targetModelUid: 'target-2',
          targetFieldPaths: ['title'],
          defaultOperator: '$eq',
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

    it('should process multiple filterModelUids successfully', async () => {
      // Setup filter configs
      const filterConfigs = [
        {
          filterModelUid: 'filter-1',
          targetModelUid: 'target-1',
          targetFieldPaths: ['name'],
          defaultOperator: '$eq',
        },
        {
          filterModelUid: 'filter-2',
          targetModelUid: 'target-1', // Same target for different filters
          targetFieldPaths: ['title'],
          defaultOperator: '$eq',
        },
        {
          filterModelUid: 'filter-2',
          targetModelUid: 'target-2',
          targetFieldPaths: ['description'],
          defaultOperator: '$eq',
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
          filterModelUid: 'filter-1',
          targetModelUid: 'target-1',
          targetFieldPaths: ['name'],
          defaultOperator: '$eq',
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
          filterModelUid: 'filter-1',
          targetModelUid: 'target-1',
          targetFieldPaths: ['name'],
          defaultOperator: '$eq',
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
          filterModelUid: 'filter-1',
          targetModelUid: 'target-1',
          targetFieldPaths: ['name'],
          defaultOperator: '$eq',
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
          filterModelUid: 'filter-1',
          targetModelUid: 'target-1',
          targetFieldPaths: ['name'],
          defaultOperator: '$eq',
        },
        {
          filterModelUid: 'filter-1',
          targetModelUid: 'target-1', // Duplicate target
          targetFieldPaths: ['email'],
          defaultOperator: '$eq',
        },
        {
          filterModelUid: 'filter-1',
          targetModelUid: 'target-2',
          targetFieldPaths: ['title'],
          defaultOperator: '$eq',
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
          filterModelUid: 'filter-1',
          targetModelUid: 'target-1',
          targetFieldPaths: ['name'],
          defaultOperator: '$eq',
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
