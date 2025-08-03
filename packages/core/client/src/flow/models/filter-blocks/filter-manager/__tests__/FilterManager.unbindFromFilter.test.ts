/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { FilterManager } from '../FilterManager';

describe('FilterManager.unbindFromFilter', () => {
  let mockGridModel: FlowModel;
  let mockFlowEngine: any;
  let filterManager: FilterManager;

  beforeEach(() => {
    // Mock FlowEngine
    mockFlowEngine = {
      getModel: vi.fn(),
    };

    // Mock GridModel
    mockGridModel = {
      flowEngine: mockFlowEngine,
      getStepParams: vi.fn().mockReturnValue([]),
      setStepParams: vi.fn(),
      save: vi.fn(),
    } as any;

    filterManager = new FilterManager(mockGridModel);
  });

  test('should throw error when filterModelUid is empty', () => {
    expect(() => filterManager.unbindFromFilter('')).toThrow('filterModelUid must be a non-empty string');
    expect(() => filterManager.unbindFromFilter(null as any)).toThrow('filterModelUid must be a non-empty string');
    expect(() => filterManager.unbindFromFilter(undefined as any)).toThrow('filterModelUid must be a non-empty string');
  });

  test('should throw error when filterModelUid is not a string', () => {
    expect(() => filterManager.unbindFromFilter(123 as any)).toThrow('filterModelUid must be a non-empty string');
    expect(() => filterManager.unbindFromFilter({} as any)).toThrow('filterModelUid must be a non-empty string');
  });

  test('should return early when no related configs exist', () => {
    // Setup: empty filter configs
    filterManager['filterConfigs'] = [];

    // Execute
    expect(() => filterManager.unbindFromFilter('filter-1')).not.toThrow();

    // Verify: no models should be retrieved
    expect(mockFlowEngine.getModel).not.toHaveBeenCalled();
  });

  test('should successfully unbind filter from single target model', () => {
    // Setup: mock filter configs
    filterManager['filterConfigs'] = [
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      },
    ];

    // Setup: mock target model with resource
    const mockTargetModel = {
      resource: {
        removeFilterGroup: vi.fn(),
      },
    };
    mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

    // Execute
    filterManager.unbindFromFilter('filter-1');

    // Verify
    expect(mockFlowEngine.getModel).toHaveBeenCalledWith('target-1');
    expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
  });

  test('should successfully unbind filter from multiple target models', () => {
    // Setup: mock filter configs with multiple targets
    filterManager['filterConfigs'] = [
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      },
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-2',
        targetFieldPaths: ['email'],
        defaultOperator: '$like',
      },
      {
        filterModelUid: 'filter-2', // Different filter, should be ignored
        targetModelUid: 'target-3',
        targetFieldPaths: ['status'],
        defaultOperator: '$eq',
      },
    ];

    // Setup: mock target models
    const mockTargetModel1 = {
      resource: {
        removeFilterGroup: vi.fn(),
      },
    };
    const mockTargetModel2 = {
      resource: {
        removeFilterGroup: vi.fn(),
      },
    };

    mockFlowEngine.getModel.mockImplementation((uid: string) => {
      if (uid === 'target-1') return mockTargetModel1;
      if (uid === 'target-2') return mockTargetModel2;
      return null;
    });

    // Execute
    filterManager.unbindFromFilter('filter-1');

    // Verify
    expect(mockFlowEngine.getModel).toHaveBeenCalledWith('target-1');
    expect(mockFlowEngine.getModel).toHaveBeenCalledWith('target-2');
    expect(mockFlowEngine.getModel).not.toHaveBeenCalledWith('target-3');
    expect(mockTargetModel1.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
    expect(mockTargetModel2.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
  });

  test('should handle duplicate target models correctly', () => {
    // Setup: mock filter configs with duplicate target models
    filterManager['filterConfigs'] = [
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      },
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1', // Same target as above
        targetFieldPaths: ['email'],
        defaultOperator: '$like',
      },
    ];

    // Setup: mock target model
    const mockTargetModel = {
      resource: {
        removeFilterGroup: vi.fn(),
      },
    };
    mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

    // Execute
    filterManager.unbindFromFilter('filter-1');

    // Verify: getModel should be called only once for the unique target
    expect(mockFlowEngine.getModel).toHaveBeenCalledTimes(1);
    expect(mockFlowEngine.getModel).toHaveBeenCalledWith('target-1');
    expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledTimes(1);
    expect(mockTargetModel.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
  });

  test('should throw error when target model is not found', () => {
    // Setup: mock filter configs
    filterManager['filterConfigs'] = [
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      },
    ];

    // Setup: mock flow engine to return null for target model
    mockFlowEngine.getModel.mockReturnValue(null);

    // Execute & Verify
    expect(() => filterManager.unbindFromFilter('filter-1')).toThrow(
      'Failed to unbind filter "filter-1" from target model "target-1": Target model with uid "target-1" not found',
    );
  });

  test('should throw error when target model does not have resource', () => {
    // Setup: mock filter configs
    filterManager['filterConfigs'] = [
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      },
    ];

    // Setup: mock target model without resource
    const mockTargetModel = {};
    mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

    // Execute & Verify
    expect(() => filterManager.unbindFromFilter('filter-1')).toThrow(
      'Failed to unbind filter "filter-1" from target model "target-1": Target model with uid "target-1" does not have a valid resource with removeFilterGroup method',
    );
  });

  test('should throw error when target model resource does not have removeFilterGroup method', () => {
    // Setup: mock filter configs
    filterManager['filterConfigs'] = [
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      },
    ];

    // Setup: mock target model with resource but without removeFilterGroup method
    const mockTargetModel = {
      resource: {},
    };
    mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

    // Execute & Verify
    expect(() => filterManager.unbindFromFilter('filter-1')).toThrow(
      'Failed to unbind filter "filter-1" from target model "target-1": Target model with uid "target-1" does not have a valid resource with removeFilterGroup method',
    );
  });

  test('should throw error when removeFilterGroup throws an error', () => {
    // Setup: mock filter configs
    filterManager['filterConfigs'] = [
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      },
    ];

    // Setup: mock target model with resource that throws error
    const mockTargetModel = {
      resource: {
        removeFilterGroup: vi.fn().mockImplementation(() => {
          throw new Error('Resource error');
        }),
      },
    };
    mockFlowEngine.getModel.mockReturnValue(mockTargetModel);

    // Execute & Verify
    expect(() => filterManager.unbindFromFilter('filter-1')).toThrow(
      'Failed to unbind filter "filter-1" from target model "target-1": Resource error',
    );
  });

  test('should continue processing other targets when one fails', () => {
    // Setup: mock filter configs with multiple targets
    filterManager['filterConfigs'] = [
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-1',
        targetFieldPaths: ['name'],
        defaultOperator: '$eq',
      },
      {
        filterModelUid: 'filter-1',
        targetModelUid: 'target-2',
        targetFieldPaths: ['email'],
        defaultOperator: '$like',
      },
    ];

    // Setup: mock target models where first one fails
    const mockTargetModel1 = {
      resource: {
        removeFilterGroup: vi.fn().mockImplementation(() => {
          throw new Error('First target error');
        }),
      },
    };
    const mockTargetModel2 = {
      resource: {
        removeFilterGroup: vi.fn(),
      },
    };

    mockFlowEngine.getModel.mockImplementation((uid: string) => {
      if (uid === 'target-1') return mockTargetModel1;
      if (uid === 'target-2') return mockTargetModel2;
      return null;
    });

    // Execute & Verify: should throw error for the first failing target
    expect(() => filterManager.unbindFromFilter('filter-1')).toThrow(
      'Failed to unbind filter "filter-1" from target model "target-1": First target error',
    );

    // Verify: first target's removeFilterGroup should have been called
    expect(mockTargetModel1.resource.removeFilterGroup).toHaveBeenCalledWith('filter-1');
  });
});
