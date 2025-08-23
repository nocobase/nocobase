/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RootPageModel } from '../RootPageModel';

// Mock PageModel
const mockPageModelSaveStepParams = vi.fn();
vi.mock('../PageModel', () => ({
  PageModel: class {
    static registerFlow() {}

    async saveStepParams() {
      return mockPageModelSaveStepParams();
    }
  },
}));

describe('RootPageModel', () => {
  let rootPageModel: RootPageModel;
  let mockContext: any;
  let mockApi: any;
  let mockFlowEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API
    mockApi = {
      request: vi.fn().mockResolvedValue({ data: { success: true } }),
    };

    // Mock FlowEngine
    mockFlowEngine = {
      getModel: vi.fn(),
      moveModel: vi.fn(),
    };

    // Mock context
    mockContext = {
      api: mockApi,
    };

    // Create RootPageModel instance
    rootPageModel = new RootPageModel({});
    (rootPageModel as any).context = mockContext;
    (rootPageModel as any).flowEngine = mockFlowEngine;
    (rootPageModel as any).props = {
      routeId: 'route-123',
    };
    (rootPageModel as any).stepParams = {
      pageSettings: {
        general: {
          enableTabs: true,
        },
      },
    };
  });

  describe('saveStepParams', () => {
    it('should call parent saveStepParams method', async () => {
      await rootPageModel.saveStepParams();

      expect(mockPageModelSaveStepParams).toHaveBeenCalledTimes(1);
    });

    it('should send API request to update route with enableTabs=true', async () => {
      (rootPageModel as any).stepParams = {
        pageSettings: {
          general: {
            enableTabs: true,
          },
        },
      };

      await rootPageModel.saveStepParams();

      expect(mockApi.request).toHaveBeenCalledWith({
        url: 'desktopRoutes:update?filter[id]=route-123',
        method: 'post',
        data: {
          enableTabs: true,
        },
      });
    });
  });

  describe('handleDragEnd', () => {
    it('should call API request to move route and flowEngine.moveModel', async () => {
      const mockActiveModel = {
        uid: 'active-uid',
        props: { route: { id: 'active-route-id' } },
      };
      const mockOverModel = {
        uid: 'over-uid',
        props: { route: { id: 'over-route-id' } },
      };

      const mockDragEndEvent = {
        active: { id: 'active-model-id' },
        over: { id: 'over-model-id' },
      };

      mockFlowEngine.getModel.mockReturnValueOnce(mockActiveModel).mockReturnValueOnce(mockOverModel);

      await rootPageModel.handleDragEnd(mockDragEndEvent as any);

      expect(mockFlowEngine.getModel).toHaveBeenCalledTimes(2);
      expect(mockFlowEngine.getModel).toHaveBeenNthCalledWith(1, 'active-model-id');
      expect(mockFlowEngine.getModel).toHaveBeenNthCalledWith(2, 'over-model-id');

      expect(mockApi.request).toHaveBeenCalledWith({
        url: 'desktopRoutes:move',
        method: 'post',
        params: {
          sourceId: 'active-route-id',
          targetId: 'over-route-id',
          sortField: 'sort',
        },
      });

      expect(mockFlowEngine.moveModel).toHaveBeenCalledWith('active-uid', 'over-uid', { persist: false });
    });

    it('should handle case when activeModel is not found', async () => {
      const mockDragEndEvent = {
        active: { id: 'active-model-id' },
        over: { id: 'over-model-id' },
      };

      mockFlowEngine.getModel
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ uid: 'over-uid', props: { route: { id: 'over-route-id' } } });

      await expect(rootPageModel.handleDragEnd(mockDragEndEvent as any)).rejects.toThrow();

      expect(mockApi.request).not.toHaveBeenCalled();
      expect(mockFlowEngine.moveModel).not.toHaveBeenCalled();
    });

    it('should handle case when overModel is not found', async () => {
      const mockDragEndEvent = {
        active: { id: 'active-model-id' },
        over: { id: 'over-model-id' },
      };

      mockFlowEngine.getModel
        .mockReturnValueOnce({ uid: 'active-uid', props: { route: { id: 'active-route-id' } } })
        .mockReturnValueOnce(null);

      await expect(rootPageModel.handleDragEnd(mockDragEndEvent as any)).rejects.toThrow();

      expect(mockApi.request).not.toHaveBeenCalled();
      expect(mockFlowEngine.moveModel).not.toHaveBeenCalled();
    });

    it('should handle API request failure gracefully', async () => {
      const mockActiveModel = {
        uid: 'active-uid',
        props: { route: { id: 'active-route-id' } },
      };
      const mockOverModel = {
        uid: 'over-uid',
        props: { route: { id: 'over-route-id' } },
      };

      const mockDragEndEvent = {
        active: { id: 'active-model-id' },
        over: { id: 'over-model-id' },
      };

      mockFlowEngine.getModel.mockReturnValueOnce(mockActiveModel).mockReturnValueOnce(mockOverModel);

      mockApi.request.mockRejectedValueOnce(new Error('API Error'));

      await expect(rootPageModel.handleDragEnd(mockDragEndEvent as any)).rejects.toThrow('API Error');

      expect(mockFlowEngine.moveModel).not.toHaveBeenCalled();
    });
  });
});
