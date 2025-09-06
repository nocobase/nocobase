/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, ViewParam } from '@nocobase/flow-engine';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveViewParamsToViewList } from '../resolveViewParamsToViewList';

// Mock FlowEngine for testing
const createMockFlowEngine = (): FlowEngine => {
  const mockEngine = {
    getModel: vi.fn(),
    loadModel: vi.fn(),
  } as any;
  return mockEngine;
};

// Mock FlowModel for testing
const createMockModel = (uid: string, viewType = 'drawer'): FlowModel => {
  const mockModel = {
    uid,
    getStepParams: vi.fn().mockReturnValue({ mode: viewType }),
  } as any;
  return mockModel;
};

describe('resolveViewParamsToViewList', () => {
  let mockFlowEngine: FlowEngine;
  let mockRouteModel: FlowModel;

  beforeEach(() => {
    mockFlowEngine = createMockFlowEngine();
    mockRouteModel = createMockModel('route-model', 'drawer');
  });

  it('should resolve single view params correctly', async () => {
    const viewParams: ViewParam[] = [{ viewUid: 'view1' }];

    const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

    expect(result).toHaveLength(1);
    expect(result[0].params.viewUid).toBe('view1');
    expect(result[0].model).toBe(mockRouteModel);
    expect(result[0].hidden).toBe(false);
  });

  it('should use route model for first view and load models for subsequent views', async () => {
    const model2 = createMockModel('view2', 'dialog');
    const model3 = createMockModel('view3', 'drawer');

    mockFlowEngine.getModel = vi
      .fn()
      .mockReturnValueOnce(null) // view2 not in cache
      .mockReturnValueOnce(model3); // view3 in cache

    mockFlowEngine.loadModel = vi.fn().mockResolvedValueOnce(model2); // load view2

    const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }, { viewUid: 'view3' }];

    const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

    expect(result).toHaveLength(3);
    expect(result[0].model).toBe(mockRouteModel);
    expect(result[1].model).toBe(model2);
    expect(result[2].model).toBe(model3);

    expect(mockFlowEngine.getModel).toHaveBeenCalledWith('view2');
    expect(mockFlowEngine.getModel).toHaveBeenCalledWith('view3');
    expect(mockFlowEngine.loadModel).toHaveBeenCalledWith({ uid: 'view2' });
  });

  it('should throw error when model not found', async () => {
    mockFlowEngine.getModel = vi.fn().mockReturnValue(null);
    mockFlowEngine.loadModel = vi.fn().mockResolvedValue(null);

    const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'missing-view' }];

    await expect(resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel)).rejects.toThrow(
      'Model with uid missing-view not found',
    );
  });

  describe('hidden logic based on view type', () => {
    it('should set hidden=false for all views when no embed type exists', async () => {
      const model2 = createMockModel('view2', 'dialog');
      const model3 = createMockModel('view3', 'drawer');

      mockFlowEngine.getModel = vi.fn().mockReturnValueOnce(model2).mockReturnValueOnce(model3);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }, { viewUid: 'view3' }];

      const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(result).toHaveLength(3);
      expect(result[0].hidden).toBe(false);
      expect(result[1].hidden).toBe(false);
      expect(result[2].hidden).toBe(false);
    });

    it('should set hidden=true for views before embed type', async () => {
      const model2 = createMockModel('view2', 'dialog');
      const model3 = createMockModel('view3', 'embed');
      const model4 = createMockModel('view4', 'drawer');

      mockFlowEngine.getModel = vi
        .fn()
        .mockReturnValueOnce(model2)
        .mockReturnValueOnce(model3)
        .mockReturnValueOnce(model4);

      const viewParams: ViewParam[] = [
        { viewUid: 'view1' },
        { viewUid: 'view2' },
        { viewUid: 'view3' },
        { viewUid: 'view4' },
      ];

      const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(result).toHaveLength(4);
      expect(result[0].hidden).toBe(true); // before embed
      expect(result[1].hidden).toBe(true); // before embed
      expect(result[2].hidden).toBe(false); // embed itself
      expect(result[3].hidden).toBe(false); // after embed
    });

    it('should handle multiple embed types correctly', async () => {
      const model2 = createMockModel('view2', 'embed');
      const model3 = createMockModel('view3', 'dialog');
      const model4 = createMockModel('view4', 'embed');

      mockFlowEngine.getModel = vi
        .fn()
        .mockReturnValueOnce(model2)
        .mockReturnValueOnce(model3)
        .mockReturnValueOnce(model4);

      const viewParams: ViewParam[] = [
        { viewUid: 'view1' },
        { viewUid: 'view2' },
        { viewUid: 'view3' },
        { viewUid: 'view4' },
      ];

      const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(result).toHaveLength(4);
      expect(result[0].hidden).toBe(true); // before first embed
      expect(result[1].hidden).toBe(true); // first embed
      expect(result[2].hidden).toBe(true); // between embeds
      expect(result[3].hidden).toBe(false); // second embed
    });

    it('should handle embed type at the beginning', async () => {
      const mockRouteModelEmbed = createMockModel('route-model', 'embed');
      const model2 = createMockModel('view2', 'dialog');
      const model3 = createMockModel('view3', 'drawer');

      mockFlowEngine.getModel = vi.fn().mockReturnValueOnce(model2).mockReturnValueOnce(model3);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }, { viewUid: 'view3' }];

      const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModelEmbed);

      expect(result).toHaveLength(3);
      expect(result[0].hidden).toBe(false); // embed itself
      expect(result[1].hidden).toBe(false); // after embed
      expect(result[2].hidden).toBe(false); // after embed
    });

    it('should handle embed type at the end', async () => {
      const model2 = createMockModel('view2', 'dialog');
      const model3 = createMockModel('view3', 'embed');

      mockFlowEngine.getModel = vi.fn().mockReturnValueOnce(model2).mockReturnValueOnce(model3);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }, { viewUid: 'view3' }];

      const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(result).toHaveLength(3);
      expect(result[0].hidden).toBe(true); // before embed
      expect(result[1].hidden).toBe(true); // before embed
      expect(result[2].hidden).toBe(false); // embed itself
    });

    it('should handle case with only embed type', async () => {
      const mockRouteModelEmbed = createMockModel('route-model', 'embed');

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }];

      const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModelEmbed);

      expect(result).toHaveLength(1);
      expect(result[0].hidden).toBe(false); // embed itself
    });
  });

  describe('getStepParams calls', () => {
    it('should call getStepParams with correct parameters', async () => {
      const model2 = createMockModel('view2', 'dialog');
      mockFlowEngine.getModel = vi.fn().mockReturnValue(model2);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }];

      await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(mockRouteModel.getStepParams).toHaveBeenCalledWith('popupSettings', 'openView');
      expect(model2.getStepParams).toHaveBeenCalledWith('popupSettings', 'openView');
    });

    it('should handle missing mode parameter correctly', async () => {
      const mockModelWithoutMode = createMockModel('view2');
      mockModelWithoutMode.getStepParams = vi.fn().mockReturnValue({}); // no mode property

      mockFlowEngine.getModel = vi.fn().mockReturnValue(mockModelWithoutMode);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }];

      const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(result).toHaveLength(2);
      expect(result[0].hidden).toBe(false); // default drawer type
      expect(result[1].hidden).toBe(false); // default drawer type
    });
  });

  describe('edge cases', () => {
    it('should handle empty view params array', async () => {
      const result = await resolveViewParamsToViewList(mockFlowEngine, [], mockRouteModel);

      expect(result).toEqual([]);
    });

    it('should handle view params with additional properties', async () => {
      const model2 = createMockModel('view2', 'dialog');
      mockFlowEngine.getModel = vi.fn().mockReturnValue(model2);

      const viewParams: ViewParam[] = [
        { viewUid: 'view1', tabUid: 'tab1', filterByTk: 'filter1' },
        { viewUid: 'view2', sourceId: 'source1' },
      ];

      const result = await resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(result).toHaveLength(2);
      expect(result[0].params).toEqual({ viewUid: 'view1', tabUid: 'tab1', filterByTk: 'filter1' });
      expect(result[1].params).toEqual({ viewUid: 'view2', sourceId: 'source1' });
    });
  });
});
