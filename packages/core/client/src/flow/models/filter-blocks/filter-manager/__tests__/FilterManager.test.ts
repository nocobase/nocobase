/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterManager, FILTER_CONFIGS_STEP_KEY } from '../FilterManager';

// Mock FlowModel
const mockFlowModel = {
  getStepParams: vi.fn(),
  setStepParams: vi.fn(),
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

      expect(mockFlowModel.getStepParams).toHaveBeenCalledWith('blockGridSettings', FILTER_CONFIGS_STEP_KEY);
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
          defaultOperator: 'eq',
        },
      ];
      mockFlowModel.getStepParams.mockReturnValue(existingConfigs);

      filterManager = new FilterManager(mockFlowModel as any);

      expect(mockFlowModel.getStepParams).toHaveBeenCalledWith('blockGridSettings', FILTER_CONFIGS_STEP_KEY);
      // 验证可以正常获取配置
      const result = filterManager.getConnectFieldsConfig('filter1');
      expect(result).toEqual({
        operator: 'eq',
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
        'blockGridSettings',
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

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith('blockGridSettings', FILTER_CONFIGS_STEP_KEY, [
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

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith('blockGridSettings', FILTER_CONFIGS_STEP_KEY, [
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

  describe('deleteFilterModelConfig', () => {
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

    it('should delete all configs with matching filterModelUid', () => {
      filterManager.deleteFilterModelConfig('filter1');

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith('blockGridSettings', FILTER_CONFIGS_STEP_KEY, [
        {
          filterModelUid: 'filter2',
          targetModelUid: 'target3',
          targetFieldPaths: ['field3'],
          defaultOperator: 'ne',
        },
      ]);
    });

    it('should do nothing when filterModelUid not found', () => {
      filterManager.deleteFilterModelConfig('nonexistent');

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith('blockGridSettings', FILTER_CONFIGS_STEP_KEY, [
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
      ]);
    });
  });

  describe('deleteTargetModelConfig', () => {
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
          targetModelUid: 'target1',
          targetFieldPaths: ['field3'],
          defaultOperator: 'ne',
        },
      ];
      mockFlowModel.getStepParams.mockReturnValue(mockConfigs);
      filterManager = new FilterManager(mockFlowModel as any);
    });

    it('should delete all configs with matching targetModelUid', () => {
      filterManager.deleteTargetModelConfig('target1');

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith('blockGridSettings', FILTER_CONFIGS_STEP_KEY, [
        {
          filterModelUid: 'filter1',
          targetModelUid: 'target2',
          targetFieldPaths: ['field2'],
          defaultOperator: 'eq',
        },
      ]);
    });

    it('should do nothing when targetModelUid not found', () => {
      filterManager.deleteTargetModelConfig('nonexistent');

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith('blockGridSettings', FILTER_CONFIGS_STEP_KEY, [
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
          targetModelUid: 'target1',
          targetFieldPaths: ['field3'],
          defaultOperator: 'ne',
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

      expect(mockFlowModel.setStepParams).toHaveBeenCalledWith('blockGridSettings', FILTER_CONFIGS_STEP_KEY, []);
    });

    it('should handle constructor with object instead of array', () => {
      mockFlowModel.getStepParams.mockReturnValue({});

      // Should throw error
      expect(() => {
        filterManager = new FilterManager(mockFlowModel as any);
        filterManager.getConnectFieldsConfig('test');
      }).toThrow('filterConfigs should be an array');
    });
  });
});
