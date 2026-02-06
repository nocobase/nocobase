/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { registerFlowMock } = vi.hoisted(() => ({
  registerFlowMock: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    FlowModel: class {
      props: any;
      context: any;
      stepParams: any;

      constructor(options: any = {}) {
        this.props = options.props || {};
        this.context = options.context || {};
        this.stepParams = options.stepParams || {};
      }

      serialize() {
        return { flowRegistry: {} };
      }

      setProps(key: string, value: any) {
        this.props[key] = value;
      }

      onInit() {}
      static registerFlow(flow: any) {
        registerFlowMock(flow);
      }
      static registerEvents() {}
      static define() {}
    },
    tExpr: (str: string) => str,
    FlowModelRenderer: () => null,
    observable: {
      ref: (value: any) => value,
    },
  };
});

vi.mock('ahooks', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useRequest: () => ({ data: null, loading: false }),
  };
});

describe('PageTabModel', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should expose documentTitle field in Edit tab settings', async () => {
    await import('../PageTabModel');
    const flow = registerFlowMock.mock.calls.find((call) => call[0]?.key === 'pageTabSettings')?.[0];

    expect(flow).toBeTruthy();
    expect(flow.steps.tab.uiSchema.documentTitle).toMatchObject({
      type: 'string',
      title: 'Document title',
      'x-decorator': 'FormItem',
    });
    expect(flow.steps.tab.uiSchema.documentTitle.description).toContain('browser tab title');
  });

  it('should place documentTitle right below tab name in Edit tab settings', async () => {
    await import('../PageTabModel');
    const flow = registerFlowMock.mock.calls.find((call) => call[0]?.key === 'pageTabSettings')?.[0];
    const keys = Object.keys(flow.steps.tab.uiSchema);

    expect(keys.indexOf('documentTitle')).toBe(keys.indexOf('title') + 1);
  });

  it('should trigger parent page title update in tab settings handler', async () => {
    await import('../PageTabModel');
    const flow = registerFlowMock.mock.calls.find((call) => call[0]?.key === 'pageTabSettings')?.[0];
    const handler = flow.steps.tab.handler;

    const setProps = vi.fn();
    const updateDocumentTitle = vi.fn().mockResolvedValue(undefined);
    const ctx = {
      model: {
        parentId: 'page-1',
        setProps,
      },
      engine: {
        getModel: vi.fn(() => ({ updateDocumentTitle })),
      },
    } as any;

    await handler(ctx, { title: 'New tab', icon: 'TableOutlined', documentTitle: 'Tab doc title' });

    expect(setProps).toHaveBeenCalledWith('title', 'New tab');
    expect(setProps).toHaveBeenCalledWith('icon', 'TableOutlined');
    expect(updateDocumentTitle).toHaveBeenCalledTimes(1);
  });

  it('should persist tab documentTitle to route options on save', async () => {
    const { RootPageTabModel } = await import('../PageTabModel');
    const request = vi.fn().mockResolvedValue({});
    const model = new RootPageTabModel({
      props: {
        route: {
          schemaUid: 'tab-1',
        },
      },
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Tab title',
            icon: 'TableOutlined',
            documentTitle: 'Tab doc title',
          },
        },
      },
      context: {
        api: { request },
        t: (value: string) => value,
      },
    } as any);

    await model.save();

    const call = request.mock.calls[0][0];
    expect(call.url).toBe('desktopRoutes:updateOrCreate');
    expect(call.data.options.documentTitle).toBe('Tab doc title');
  });
});
