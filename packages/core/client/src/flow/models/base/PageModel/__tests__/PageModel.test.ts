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
    parsePathnameToViewParams: (pathname: string) => {
      if (!pathname) return [];
      const segments = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
      const result: Array<{ viewUid: string }> = [];
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if ((segment === 'admin' || segment === 'view') && segments[i + 1]) {
          result.push({ viewUid: segments[i + 1] });
          i += 1;
        }
      }
      return result;
    },
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
    document.title = '';

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

  describe('document title priority', () => {
    beforeEach(() => {
      (pageModel as any).context = {
        closable: false,
        view: {
          inputArgs: { pageActive: true },
          navigation: null,
        },
        resolveJsonTemplate: vi.fn(async (value: string) => value),
      } as any;
      (pageModel as any).flowEngine = {
        getModel: vi.fn(),
      } as any;
    });

    it('should use page documentTitle first when enableTabs is false', async () => {
      pageModel.props = { enableTabs: false, title: 'Page title' } as any;
      (pageModel as any).stepParams = {
        pageSettings: {
          general: {
            documentTitle: 'Page doc title',
          },
        },
      };
      (pageModel as any).context.resolveJsonTemplate = vi.fn(async () => 'Resolved page doc title');

      await (pageModel as any).updateDocumentTitle();

      expect((pageModel as any).context.resolveJsonTemplate).toHaveBeenCalledWith('Page doc title');
      expect(document.title).toBe('Resolved page doc title');
    });

    it('should fallback to page title when page documentTitle is empty', async () => {
      pageModel.props = { enableTabs: false, title: 'Fallback page title' } as any;
      (pageModel as any).stepParams = {
        pageSettings: {
          general: {
            documentTitle: '',
          },
        },
      };

      await (pageModel as any).updateDocumentTitle();

      expect(document.title).toBe('Fallback page title');
    });

    it('should use active tab documentTitle first when enableTabs is true', async () => {
      pageModel.props = { enableTabs: true } as any;
      const activeTab = {
        uid: 'tab-1',
        stepParams: {
          pageTabSettings: {
            tab: {
              documentTitle: 'Tab doc title',
            },
          },
        },
        getTabTitle: vi.fn(() => 'Tab title'),
      };
      (pageModel as any).subModels = { tabs: [activeTab] };
      (pageModel as any).context.resolveJsonTemplate = vi.fn(async () => 'Resolved tab doc title');
      (pageModel as any).flowEngine.getModel = vi.fn(() => activeTab);

      await (pageModel as any).updateDocumentTitle();

      expect(document.title).toBe('Resolved tab doc title');
    });

    it('should fallback to tab title when active tab documentTitle is empty', async () => {
      pageModel.props = { enableTabs: true } as any;
      const activeTab = {
        uid: 'tab-1',
        stepParams: {
          pageTabSettings: {
            tab: {
              documentTitle: '',
            },
          },
        },
        getTabTitle: vi.fn(() => 'Fallback tab title'),
      };
      (pageModel as any).subModels = { tabs: [activeTab] };
      (pageModel as any).flowEngine.getModel = vi.fn(() => activeTab);

      await (pageModel as any).updateDocumentTitle();

      expect(document.title).toBe('Fallback tab title');
    });

    it('should also update document title for closable page (popup)', async () => {
      pageModel.props = { enableTabs: false, title: 'Popup page title' } as any;
      (pageModel as any).context = {
        closable: true,
        view: {
          inputArgs: { pageActive: true },
          navigation: null,
        },
        resolveJsonTemplate: vi.fn(async () => 'Resolved popup doc title'),
      } as any;
      (pageModel as any).stepParams = {
        pageSettings: {
          general: {
            documentTitle: 'Popup doc title',
          },
        },
      };

      await (pageModel as any).updateDocumentTitle();

      expect(document.title).toBe('Resolved popup doc title');
    });

    it('should update title immediately with target tab key on tab switch', async () => {
      pageModel.props = { enableTabs: true, tabActiveKey: 'tab-old' } as any;
      const tabOld = {
        uid: 'tab-old',
        stepParams: {
          pageTabSettings: {
            tab: {
              documentTitle: '',
            },
          },
        },
        getTabTitle: vi.fn(() => 'Old tab'),
        context: {},
        subModels: { grid: { mapSubModels: vi.fn() } },
      };
      const tabNew = {
        uid: 'tab-new',
        stepParams: {
          pageTabSettings: {
            tab: {
              documentTitle: '',
            },
          },
        },
        getTabTitle: vi.fn(() => 'New tab'),
        context: {},
        subModels: { grid: { mapSubModels: vi.fn() } },
      };
      (pageModel as any).subModels = { tabs: [tabOld, tabNew] };
      (pageModel as any).flowEngine = {
        getModel: vi.fn((uid: string) => (uid === 'tab-new' ? tabNew : tabOld)),
      };

      pageModel.invokeTabModelLifecycleMethod('tab-new', 'onActive');
      await Promise.resolve();

      expect(document.title).toBe('New tab');
    });

    it('should retry once when active tab model is not ready yet', async () => {
      vi.useFakeTimers();
      try {
        pageModel.props = { enableTabs: true, tabActiveKey: 'tab-late' } as any;
        const lateTab = {
          uid: 'tab-late',
          stepParams: {
            pageTabSettings: {
              tab: {
                documentTitle: '',
              },
            },
          },
          getTabTitle: vi.fn(() => 'Late tab'),
          context: {},
          subModels: { grid: { mapSubModels: vi.fn() } },
        };
        const getModel = vi.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(lateTab).mockReturnValue(lateTab);
        (pageModel as any).flowEngine = { getModel } as any;

        await (pageModel as any).updateDocumentTitle('tab-late');
        expect(document.title).not.toBe('Late tab');

        await vi.runAllTimersAsync();

        expect(document.title).toBe('Late tab');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should skip title update when current route-managed view is not top view in URL', async () => {
      pageModel.props = { enableTabs: false, title: 'Main page title' } as any;
      (pageModel as any).context = {
        closable: false,
        view: {
          inputArgs: { pageActive: true, viewUid: 'main-view' },
          navigation: {},
        },
        resolveJsonTemplate: vi.fn(async () => 'Main document title'),
      } as any;
      (pageModel as any).flowEngine = {
        getModel: vi.fn(),
        context: {
          route: {
            pathname: '/admin/main-view/view/popup-view',
          },
        },
      } as any;
      (pageModel as any).stepParams = {
        pageSettings: {
          general: {
            documentTitle: 'Main document title',
          },
        },
      };

      await (pageModel as any).updateDocumentTitle();

      expect(document.title).toBe('');
    });

    it('should allow title update when current route-managed view is top view in URL', async () => {
      pageModel.props = { enableTabs: false, title: 'Popup page title' } as any;
      (pageModel as any).context = {
        closable: true,
        view: {
          inputArgs: { pageActive: true, viewUid: 'popup-view' },
          navigation: {},
        },
        resolveJsonTemplate: vi.fn(async () => 'Popup document title'),
      } as any;
      (pageModel as any).flowEngine = {
        getModel: vi.fn(),
        context: {
          route: {
            pathname: '/admin/main-view/view/popup-view',
          },
        },
      } as any;
      (pageModel as any).stepParams = {
        pageSettings: {
          general: {
            documentTitle: 'Popup document title',
          },
        },
      };

      await (pageModel as any).updateDocumentTitle();

      expect(document.title).toBe('Popup document title');
    });
  });
});
