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
import { resolveViewParamsToViewList, updateViewListHidden } from '../resolveViewParamsToViewList';
import { RouteModel } from '../models/base/RouteModel';

// Mock FlowEngine for testing
const createMockFlowEngine = (): FlowEngine => {
  const mockEngine = {
    getModel: vi.fn(),
    loadModel: vi.fn(),
  } as any;
  return mockEngine;
};

// Mock FlowModel for testing
const createMockModel = (uid: string, viewType = 'drawer', isRouteModel = false): FlowModel => {
  const mockModel = {
    uid,
    getStepParams: vi.fn().mockReturnValue({ mode: viewType }),
  } as any;

  if (isRouteModel) {
    Object.setPrototypeOf(mockModel, RouteModel.prototype);
  }

  return mockModel;
};

describe('resolveViewParamsToViewList', () => {
  let mockFlowEngine: FlowEngine;
  let mockRouteModel: FlowModel;

  beforeEach(() => {
    mockFlowEngine = createMockFlowEngine();
    mockRouteModel = createMockModel('route-model', 'drawer', true);
  });

  it('should resolve single view params correctly', () => {
    const viewParams: ViewParam[] = [{ viewUid: 'view1' }];

    const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

    expect(result).toHaveLength(1);
    expect(result[0].params.viewUid).toBe('view1');
    expect(result[0].model).toBe(mockRouteModel);
    expect(result[0].hidden.value).toBe(false);
  });

  it('should use route model for first view and try to get models for subsequent views', () => {
    const model3 = createMockModel('view3', 'drawer');

    mockFlowEngine.getModel = vi
      .fn()
      .mockReturnValueOnce(null) // view2 not in cache
      .mockReturnValueOnce(model3); // view3 in cache

    const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }, { viewUid: 'view3' }];

    const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

    expect(result).toHaveLength(3);
    expect(result[0].model).toBe(mockRouteModel);
    expect(result[1].model).toBeNull();
    expect(result[1].modelUid).toBe('view2');
    expect(result[2].model).toBe(model3);

    expect(mockFlowEngine.getModel).toHaveBeenCalledWith('view2', true);
    expect(mockFlowEngine.getModel).toHaveBeenCalledWith('view3', true);
    expect(mockFlowEngine.loadModel).not.toHaveBeenCalled();
  });

  it('should not throw error when model not found', () => {
    mockFlowEngine.getModel = vi.fn().mockReturnValue(null);

    const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'missing-view' }];

    const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

    expect(result).toHaveLength(2);
    expect(result[1].model).toBeNull();
  });

  describe('hidden logic based on view type', () => {
    it('should set hidden=false for all views when no embed type exists', () => {
      const model2 = createMockModel('view2', 'dialog');
      const model3 = createMockModel('view3', 'drawer');

      mockFlowEngine.getModel = vi.fn().mockReturnValueOnce(model2).mockReturnValueOnce(model3);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }, { viewUid: 'view3' }];

      const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(result).toHaveLength(3);
      expect(result[0].hidden.value).toBe(false);
      expect(result[1].hidden.value).toBe(false);
      expect(result[2].hidden.value).toBe(false);
    });

    it('should set hidden=true for views before embed type', () => {
      const model2 = createMockModel('view2', 'dialog');
      const model3 = createMockModel('view3', 'embed');
      // Mock RouteModel check for embed
      Object.setPrototypeOf(model3, RouteModel.prototype);

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

      const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);
      updateViewListHidden(result);

      expect(result).toHaveLength(4);
      expect(result[0].hidden.value).toBe(true); // before embed
      expect(result[1].hidden.value).toBe(true); // before embed
      expect(result[2].hidden.value).toBe(false); // embed itself
      expect(result[3].hidden.value).toBe(false); // after embed
    });

    it('should handle multiple embed types correctly', () => {
      const model2 = createMockModel('view2', 'embed');
      Object.setPrototypeOf(model2, RouteModel.prototype);

      const model3 = createMockModel('view3', 'dialog');

      const model4 = createMockModel('view4', 'embed');
      Object.setPrototypeOf(model4, RouteModel.prototype);

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

      const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);
      updateViewListHidden(result);

      expect(result).toHaveLength(4);
      expect(result[0].hidden.value).toBe(true); // before first embed
      expect(result[1].hidden.value).toBe(true); // first embed
      expect(result[2].hidden.value).toBe(true); // between embeds
      expect(result[3].hidden.value).toBe(false); // second embed
    });

    it('should handle embed type at the beginning', () => {
      const mockRouteModelEmbed = createMockModel('route-model', 'embed', true);
      const model2 = createMockModel('view2', 'dialog');
      const model3 = createMockModel('view3', 'drawer');

      mockFlowEngine.getModel = vi.fn().mockReturnValueOnce(model2).mockReturnValueOnce(model3);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }, { viewUid: 'view3' }];

      const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModelEmbed);
      updateViewListHidden(result);

      expect(result).toHaveLength(3);
      expect(result[0].hidden.value).toBe(false); // embed itself
      expect(result[1].hidden.value).toBe(false); // after embed
      expect(result[2].hidden.value).toBe(false); // after embed
    });

    it('should handle embed type at the end', () => {
      const model2 = createMockModel('view2', 'dialog');
      const model3 = createMockModel('view3', 'embed');
      Object.setPrototypeOf(model3, RouteModel.prototype);

      mockFlowEngine.getModel = vi.fn().mockReturnValueOnce(model2).mockReturnValueOnce(model3);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }, { viewUid: 'view3' }];

      const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);
      updateViewListHidden(result);

      expect(result).toHaveLength(3);
      expect(result[0].hidden.value).toBe(true); // before embed
      expect(result[1].hidden.value).toBe(true); // before embed
      expect(result[2].hidden.value).toBe(false); // embed itself
    });

    it('should handle case with only embed type', () => {
      const mockRouteModelEmbed = createMockModel('route-model', 'embed', true);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }];

      const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModelEmbed);
      updateViewListHidden(result);

      expect(result).toHaveLength(1);
      expect(result[0].hidden.value).toBe(false); // embed itself
    });
  });

  describe('getStepParams calls', () => {
    it('should call getStepParams with correct parameters', () => {
      const model2 = createMockModel('view2', 'dialog');
      mockFlowEngine.getModel = vi.fn().mockReturnValue(model2);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }];

      const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);
      updateViewListHidden(result);

      // mockRouteModel is checked for instanceof RouteModel, so getStepParams might not be called if it is RouteModel
      // In implementation: if (viewItem.model instanceof RouteModel) return 'embed';
      // So getStepParams is NOT called for RouteModel.
      // expect(mockRouteModel.getStepParams).toHaveBeenCalledWith('popupSettings', 'openView');

      expect(model2.getStepParams).toHaveBeenCalledWith('popupSettings', 'openView');
    });

    it('should handle missing mode parameter correctly', () => {
      const mockModelWithoutMode = createMockModel('view2');
      mockModelWithoutMode.getStepParams = vi.fn().mockReturnValue({}); // no mode property

      mockFlowEngine.getModel = vi.fn().mockReturnValue(mockModelWithoutMode);

      const viewParams: ViewParam[] = [{ viewUid: 'view1' }, { viewUid: 'view2' }];

      const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(result).toHaveLength(2);
      expect(result[0].hidden.value).toBe(false); // default drawer type
      expect(result[1].hidden.value).toBe(false); // default drawer type
    });
  });

  describe('edge cases', () => {
    it('should handle empty view params array', () => {
      const result = resolveViewParamsToViewList(mockFlowEngine, [], mockRouteModel);

      expect(result).toEqual([]);
    });

    it('should handle view params with additional properties', () => {
      const model2 = createMockModel('view2', 'dialog');
      mockFlowEngine.getModel = vi.fn().mockReturnValue(model2);

      const viewParams: ViewParam[] = [
        { viewUid: 'view1', tabUid: 'tab1', filterByTk: 'filter1' },
        { viewUid: 'view2', sourceId: 'source1' },
      ];

      const result = resolveViewParamsToViewList(mockFlowEngine, viewParams, mockRouteModel);

      expect(result).toHaveLength(2);
      expect(result[0].params).toEqual({ viewUid: 'view1', tabUid: 'tab1', filterByTk: 'filter1' });
      expect(result[1].params).toEqual({ viewUid: 'view2', sourceId: 'source1' });
    });
  });
});
