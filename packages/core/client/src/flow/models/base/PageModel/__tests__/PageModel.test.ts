/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PageModel } from '../PageModel';
import { DragEndEvent } from '@dnd-kit/core';

// Mock FlowModel and other dependencies
vi.mock('@nocobase/flow-engine', () => {
  const VIEW_ACTIVATED_VERSION = Symbol.for('__NOCOBASE_VIEW_ACTIVATED_VERSION__');
  return {
    FlowModel: class {
      props: any;
      context: any;
      subModels: any = {};
      constructor(options: any = {}) {
        this.props = options.props || {};
        this.context = options.context || {};
      }
      onMount() {}
      onUnmount() {}
      setProps(key: string, value: any) {
        this.props[key] = value;
      }
      mapSubModels(key: string, callback: any) {
        if (this.subModels[key]) {
          return this.subModels[key].map(callback);
        }
        return [];
      }
      static registerFlow() {}
    },
    tExpr: (str: string) => str,
    DndProvider: ({ children }: any) => children,
    AddSubModelButton: () => null,
    FlowSettingsButton: () => null,
    FlowModelRenderer: () => null,
    Droppable: ({ children }: any) => children,
    DragHandler: () => null,
    getPageActive: (ctx: any) => ctx?.view?.inputArgs?.pageActive,
    getEmitterViewActivatedVersion: (emitter: unknown): number => {
      if (!emitter || (typeof emitter !== 'object' && typeof emitter !== 'function')) return 0;
      const raw = Reflect.get(emitter as object, VIEW_ACTIVATED_VERSION);
      const num = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(num) && num > 0 ? num : 0;
    },
    CreateModelOptions: class {},
    VIEW_ACTIVATED_VERSION,
    VIEW_ACTIVATED_EVENT: 'view:activated',
    DATA_SOURCE_DIRTY_EVENT: 'dataSource:dirty',
  };
});

vi.mock('antd', () => ({
  Tabs: (props: any) => null,
}));

vi.mock('@ant-design/icons', () => ({
  PlusOutlined: () => null,
}));

vi.mock('@ant-design/pro-layout', () => ({
  PageHeader: () => null,
}));

describe('PageModel', () => {
  let pageModel: PageModel;
  let mockDragEndEvent: DragEndEvent;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create PageModel instance
    pageModel = new PageModel({});
    // Initialize subModels
    (pageModel as any).subModels = {};
  });

  describe('handleDragEnd', () => {
    it('should throw "Method not implemented." error', async () => {
      mockDragEndEvent = {
        active: { id: 'active' },
        over: { id: 'over' },
      } as any;
      await expect(pageModel.handleDragEnd(mockDragEndEvent)).rejects.toThrow();
    });
  });

  describe('getFirstTab', () => {
    it('should return the first tab if tabs exist', () => {
      const mockTab1 = { uid: 'tab1' };
      const mockTab2 = { uid: 'tab2' };
      (pageModel as any).subModels = { tabs: [mockTab1, mockTab2] };
      expect(pageModel.getFirstTab()).toBe(mockTab1);
    });

    it('should return undefined if tabs do not exist', () => {
      (pageModel as any).subModels = { tabs: [] };
      expect(pageModel.getFirstTab()).toBeUndefined();
    });

    it('should return undefined if subModels.tabs is undefined', () => {
      (pageModel as any).subModels = {};
      expect(pageModel.getFirstTab()).toBeUndefined();
    });
  });

  describe('renderTabs activeKey logic', () => {
    beforeEach(() => {
      // Mock mapTabs to avoid complex rendering logic inside it
      pageModel.mapTabs = vi.fn().mockReturnValue([]);
      // Mock t function in context
      // @ts-ignore
      pageModel.context = {
        t: (str: string) => str,
        view: { navigation: null },
      } as any;
    });

    it('should use viewParams.tabUid if available', () => {
      pageModel.context.view = {
        // @ts-ignore
        navigation: {
          viewParams: {
            tabUid: 'tab-from-params',
          },
        },
      };

      const result = pageModel.renderTabs() as any;
      // result is <DndProvider><Tabs ... /></DndProvider>
      const tabsElement = result.props.children;

      expect(tabsElement.props.activeKey).toBe('tab-from-params');
    });

    it('should use first tab uid if viewParams exists but tabUid is missing', () => {
      const mockTab1 = { uid: 'first-tab-uid' };
      (pageModel as any).subModels = { tabs: [mockTab1] };
      pageModel.context.view = {
        // @ts-ignore
        navigation: {
          viewParams: {}, // exists but empty tabUid
        },
      };

      const result = pageModel.renderTabs() as any;
      const tabsElement = result.props.children;
      expect(tabsElement.props.activeKey).toBe('first-tab-uid');
    });

    it('should use props.tabActiveKey if viewParams is missing', () => {
      pageModel.props = { tabActiveKey: 'tab-from-props' } as any;
      // @ts-ignore
      pageModel.context.view = {
        navigation: null, // viewParams missing
      };

      const result = pageModel.renderTabs() as any;
      const tabsElement = result.props.children;
      expect(tabsElement.props.activeKey).toBe('tab-from-props');
    });
  });

  describe('dirty refresh signal', () => {
    it('should invoke current tab onActive when dataSource:dirty is emitted and page is active', async () => {
      const listeners: Record<string, any> = {};
      const invokeSpy = vi.spyOn(pageModel as any, 'invokeTabModelLifecycleMethod').mockImplementation(() => undefined);

      (pageModel as any).flowEngine = {
        emitter: {
          on: vi.fn((event: string, cb: any) => {
            listeners[event] = cb;
          }),
          off: vi.fn(),
        },
      };
      // @ts-ignore
      pageModel.context = {
        view: {
          navigation: null,
          inputArgs: { tabUid: 'tab1', pageActive: true },
        },
      } as any;

      pageModel.onMount();

      expect(typeof listeners['dataSource:dirty']).toBe('function');
      listeners['dataSource:dirty']({ dataSourceKey: 'main', resourceNames: ['posts'] });
      await Promise.resolve();

      expect(invokeSpy).toHaveBeenCalledWith('tab1', 'onActive');
    });

    it('should invoke current tab onActive on mount when view:activated happened before PageModel mounted', () => {
      const listeners: Record<string, any> = {};
      const invokeSpy = vi.spyOn(pageModel as any, 'invokeTabModelLifecycleMethod').mockImplementation(() => undefined);
      const VIEW_ACTIVATED_VERSION = Symbol.for('__NOCOBASE_VIEW_ACTIVATED_VERSION__');

      const emitter: any = {
        on: vi.fn((event: string, cb: any) => {
          listeners[event] = cb;
        }),
        off: vi.fn(),
      };
      emitter[VIEW_ACTIVATED_VERSION] = 1;

      (pageModel as any).flowEngine = {
        emitter,
      };
      // @ts-ignore
      pageModel.context = {
        view: {
          navigation: null,
          inputArgs: { tabUid: 'tab1', pageActive: true },
        },
      } as any;

      pageModel.onMount();

      expect(typeof listeners['view:activated']).toBe('function');
      expect(invokeSpy).toHaveBeenCalledWith('tab1', 'onActive');
    });
  });
});
