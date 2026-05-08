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
const mockPageModelOpenFlowSettings = vi.fn();
vi.mock('../PageModel', () => ({
  PageModel: class {
    props: any = {};
    stepParams: any = {};

    static registerFlow() {}

    setProps(key: string, value: any) {
      this.props[key] = value;
    }

    setStepParams(flowKey: string, stepKey: string, params: Record<string, any>) {
      if (!this.stepParams[flowKey]) {
        this.stepParams[flowKey] = {};
      }
      this.stepParams[flowKey][stepKey] = {
        ...this.stepParams[flowKey][stepKey],
        ...params,
      };
    }

    async openFlowSettings(options?: any) {
      return mockPageModelOpenFlowSettings(options);
    }

    async saveStepParams() {
      return mockPageModelSaveStepParams();
    }
  },
}));

describe('RootPageModel', () => {
  let rootPageModel: RootPageModel;
  let mockContext: any;
  let mockApi: any;
  let mockRefreshDesktopRoutes: any;
  let mockFlowEngine: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock API
    mockApi = {
      request: vi.fn().mockResolvedValue({ data: { success: true } }),
    };
    mockRefreshDesktopRoutes = vi.fn().mockResolvedValue(undefined);

    // Mock FlowEngine
    mockFlowEngine = {
      getModel: vi.fn(),
      moveModel: vi.fn(),
    };

    // Mock context
    mockContext = {
      api: mockApi,
      refreshDesktopRoutes: mockRefreshDesktopRoutes,
      currentRoute: {
        id: 'route-123',
        enableTabs: true,
      },
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

  describe('openFlowSettings', () => {
    it('should use desktop route enableTabs as settings dialog initial value', async () => {
      mockContext.currentRoute.enableTabs = false;
      (rootPageModel as any).stepParams = {
        pageSettings: {
          general: {
            displayTitle: true,
            enableTabs: true,
          },
        },
      };

      await rootPageModel.openFlowSettings({ flowKey: 'pageSettings', stepKey: 'general' } as any);

      expect((rootPageModel as any).stepParams.pageSettings.general).toMatchObject({
        displayTitle: true,
        enableTabs: false,
      });
      expect(mockPageModelOpenFlowSettings).toHaveBeenCalledWith({
        flowKey: 'pageSettings',
        stepKey: 'general',
      });
    });

    it('should keep flow model enableTabs when route status is unavailable', async () => {
      mockContext.currentRoute = {};
      (rootPageModel as any).stepParams = {
        pageSettings: {
          general: {
            enableTabs: true,
          },
        },
      };

      await rootPageModel.openFlowSettings({ flowKey: 'pageSettings', stepKey: 'general' } as any);

      expect((rootPageModel as any).stepParams.pageSettings.general.enableTabs).toBe(true);
    });

    it('should not sync enableTabs when opening other settings steps', async () => {
      mockContext.currentRoute.enableTabs = false;
      (rootPageModel as any).stepParams = {
        pageSettings: {
          general: {
            enableTabs: true,
          },
        },
      };

      await rootPageModel.openFlowSettings({ flowKey: 'otherSettings', stepKey: 'general' } as any);

      expect((rootPageModel as any).stepParams.pageSettings.general.enableTabs).toBe(true);
      expect(mockPageModelOpenFlowSettings).toHaveBeenCalledWith({
        flowKey: 'otherSettings',
        stepKey: 'general',
      });
    });
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

    it('should refresh desktop routes after route update is persisted', async () => {
      await rootPageModel.saveStepParams();

      expect(mockApi.request).toHaveBeenCalledTimes(1);
      expect(mockRefreshDesktopRoutes).toHaveBeenCalledTimes(1);
      expect(mockApi.request.mock.invocationCallOrder[0]).toBeLessThan(
        mockRefreshDesktopRoutes.mock.invocationCallOrder[0],
      );
    });

    it('should apply enableTabs to current page immediately after route update is persisted', async () => {
      (rootPageModel as any).stepParams = {
        pageSettings: {
          general: {
            enableTabs: false,
          },
        },
      };

      await rootPageModel.saveStepParams();

      expect(mockContext.currentRoute.enableTabs).toBe(false);
      expect((rootPageModel as any).props.enableTabs).toBe(false);
      expect(mockApi.request.mock.invocationCallOrder[0]).toBeLessThan(
        mockRefreshDesktopRoutes.mock.invocationCallOrder[0],
      );
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

    it('should save new tab before moving when route id is missing', async () => {
      const mockActiveModel = {
        uid: 'active-uid',
        props: { route: { schemaUid: 'active-schema-uid' } },
        save: vi.fn(async () => {
          mockActiveModel.props.route.id = 'active-route-id';
        }),
      };
      const mockOverModel = {
        uid: 'over-uid',
        props: { route: { id: 'over-route-id' } },
        save: vi.fn(),
      };

      const mockDragEndEvent = {
        active: { id: 'active-model-id' },
        over: { id: 'over-model-id' },
      };

      mockFlowEngine.getModel.mockReturnValueOnce(mockActiveModel).mockReturnValueOnce(mockOverModel);

      await rootPageModel.handleDragEnd(mockDragEndEvent as any);

      expect(mockActiveModel.save).toHaveBeenCalledTimes(1);
      expect(mockOverModel.save).not.toHaveBeenCalled();
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

    it('should skip self-drop to avoid duplicate saves for the same new tab', async () => {
      const mockModel = {
        uid: 'same-uid',
        props: { route: { schemaUid: 'same-schema-uid' } },
        save: vi.fn(),
      };

      const mockDragEndEvent = {
        active: { id: 'same-model-id' },
        over: { id: 'same-model-id' },
      };

      mockFlowEngine.getModel.mockReturnValue(mockModel);

      await rootPageModel.handleDragEnd(mockDragEndEvent as any);

      expect(mockModel.save).not.toHaveBeenCalled();
      expect(mockApi.request).not.toHaveBeenCalled();
      expect(mockFlowEngine.moveModel).not.toHaveBeenCalled();
    });

    it('should handle case when activeModel is not found', async () => {
      const mockDragEndEvent = {
        active: { id: 'active-model-id' },
        over: { id: 'over-model-id' },
      };

      mockFlowEngine.getModel
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ uid: 'over-uid', props: { route: { id: 'over-route-id' } } });
      await rootPageModel.handleDragEnd(mockDragEndEvent as any);
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
      // 实现选择静默返回而非抛错，这里只断言无副作用
      await rootPageModel.handleDragEnd(mockDragEndEvent as any);
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
