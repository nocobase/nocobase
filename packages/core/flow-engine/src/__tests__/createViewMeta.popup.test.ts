/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { FlowContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
import type { FlowView } from '../views/FlowView';
import { buildPopupRuntime, createPopupMeta } from '../views/createViewMeta';

describe('createPopupMeta - popup variables', () => {
  function makeCtx() {
    const engine = new FlowEngine();
    const ctx = new FlowContext();
    ctx.defineProperty('engine', { value: engine });
    // 简化 i18n：直接返回 key
    ctx.defineProperty('t', { value: (s: string) => s });
    return { engine, ctx };
  }

  function makeNestedPopupView(viewUid: string, filterByTk: number): FlowView {
    return {
      type: 'drawer',
      inputArgs: {
        viewUid,
        filterByTk,
        sourceId: 13,
      },
      Header: null,
      Footer: null,
      close: () => void 0,
      update: () => void 0,
      navigation: {
        viewStack: [
          { viewUid: 'base-page-uid' },
          { viewUid: 'parent-popup-uid', filterByTk: 13, sourceId: 13 },
          { viewUid: 'child-popup-uid', filterByTk: 24, sourceId: 13 },
        ],
      } as any,
    } as any;
  }

  function mockNestedPopupModels(engine: FlowEngine) {
    vi.spyOn(engine as any, 'getModel').mockImplementation((uid: string) => {
      if (uid === 'parent-popup-uid') {
        return {
          getStepParams: vi.fn((_fk: string, sk: string) =>
            sk === 'openView'
              ? {
                  collectionName: 'users',
                  dataSourceKey: 'main',
                  associationName: 'users.orgs',
                }
              : undefined,
          ),
        };
      }
      if (uid === 'child-popup-uid') {
        return {
          getStepParams: vi.fn((_fk: string, sk: string) =>
            sk === 'openView'
              ? {
                  collectionName: 'orgs',
                  dataSourceKey: 'main',
                  associationName: 'users.orgs',
                }
              : undefined,
          ),
        };
      }
      return {
        getStepParams: vi.fn(() => undefined),
      };
    });
  }

  it('buildVariablesParams(record) uses anchor view instead of ctx.view', async () => {
    const { engine, ctx } = makeCtx();

    // 模拟锚定弹窗视图（被测试目标）
    const anchorView: FlowView = {
      type: 'embed',
      inputArgs: {},
      Header: null,
      Footer: null,
      close: () => void 0,
      update: () => void 0,
      navigation: {
        viewStack: [
          {
            viewUid: 'base-page-uid',
          },
          {
            viewUid: 'popup-uid',
            filterByTk: 111,
            sourceId: 42,
          },
        ],
      } as any,
    } as any;

    // ctx.view 指向另一个（例如设置弹窗）
    ctx.defineProperty('view', {
      value: {
        type: 'dialog',
        inputArgs: {},
        navigation: {
          viewStack: [
            {
              viewUid: 'settings-uid',
              filterByTk: 9999,
            },
          ],
        },
      },
    });

    // 为两个视图 uid 注入不同的 openView 配置，确保只取锚定视图
    const popupModel = {
      getStepParams: vi.fn((_fk: string, sk: string) =>
        sk === 'openView'
          ? {
              collectionName: 'posts',
              dataSourceKey: 'main',
              associationName: 'users.posts',
            }
          : undefined,
      ),
    } as any;
    const settingsModel = {
      getStepParams: vi.fn((_fk: string, sk: string) =>
        sk === 'openView'
          ? {
              collectionName: 'comments',
              dataSourceKey: 'main',
            }
          : undefined,
      ),
    } as any;

    const getModelSpy = vi.spyOn(engine as any, 'getModel');
    getModelSpy.mockImplementation((uid: string) => (uid === 'popup-uid' ? popupModel : settingsModel));

    const metaFactory = createPopupMeta(ctx, anchorView);
    const meta = (await metaFactory())!;

    // record 应来自锚定视图的 openView 配置
    const vars = (await meta.buildVariablesParams!(ctx)) as any;
    expect(vars).toBeTruthy();
    expect(vars.record).toEqual({
      collection: 'posts',
      dataSourceKey: 'main',
      filterByTk: 111,
      associationName: 'users.posts',
      sourceId: 42,
    });

    // 确认没有误用 ctx.view（settings-uid）的集合
    expect(vars.record.collection).not.toBe('comments');
  });

  it('buildPopupRuntime anchors current popup even when the navigation stack already has a child popup', async () => {
    const { engine, ctx } = makeCtx();
    const parentView = makeNestedPopupView('parent-popup-uid', 13);
    mockNestedPopupModels(engine);

    const popup = await buildPopupRuntime(ctx, parentView);

    expect(popup?.uid).toBe('parent-popup-uid');
    expect(popup?.resource).toEqual({
      dataSourceKey: 'main',
      collectionName: 'users',
      associationName: 'users.orgs',
      filterByTk: 13,
      sourceId: 13,
    });
  });

  it('buildVariablesParams(record) keeps the parent view record when a child popup is open', async () => {
    const { engine, ctx } = makeCtx();
    const parentView = makeNestedPopupView('parent-popup-uid', 13);
    mockNestedPopupModels(engine);

    const meta = (await createPopupMeta(ctx, parentView)())!;
    const vars = (await meta.buildVariablesParams!(ctx)) as any;

    expect(vars.record).toEqual({
      collection: 'users',
      dataSourceKey: 'main',
      filterByTk: 13,
      associationName: 'users.orgs',
      sourceId: 13,
    });
  });

  it('buildVariablesParams(parent.record) is still relative to the child popup view', async () => {
    const { engine, ctx } = makeCtx();
    const childView = makeNestedPopupView('child-popup-uid', 24);
    mockNestedPopupModels(engine);

    const meta = (await createPopupMeta(ctx, childView)())!;
    const vars = (await meta.buildVariablesParams!(ctx)) as any;

    expect(vars.record).toEqual({
      collection: 'orgs',
      dataSourceKey: 'main',
      filterByTk: 24,
      associationName: 'users.orgs',
      sourceId: 13,
    });
    expect(vars.parent.record).toEqual({
      collection: 'users',
      dataSourceKey: 'main',
      filterByTk: 13,
      sourceId: 13,
      associationName: 'users.orgs',
    });
  });

  it('properties() provides a record factory node (lazy) with title', async () => {
    const { engine, ctx } = makeCtx();
    // 只要能通过 anchorView 推断到集合名和主键即可；集合详情在懒加载时再取
    const anchorView: FlowView = {
      type: 'embed',
      inputArgs: {},
      Header: null,
      Footer: null,
      close: () => void 0,
      update: () => void 0,
      navigation: { viewStack: [{ viewUid: 'base-page-uid' }, { viewUid: 'popup-uid', filterByTk: 1 }] } as any,
    } as any;
    const popupModel = {
      getStepParams: vi.fn((_fk: string, sk: string) =>
        sk === 'openView'
          ? {
              collectionName: 'tasks',
              dataSourceKey: 'main',
            }
          : undefined,
      ),
    } as any;
    vi.spyOn(engine as any, 'getModel').mockImplementation(() => popupModel);

    const meta = (await createPopupMeta(ctx, anchorView)())!;
    const props = typeof meta.properties === 'function' ? await (meta.properties as any)() : meta.properties || {};
    // 断言存在 record 节点工厂，且有标题（懒加载，不触发集合访问）
    expect(typeof props.record).toBe('function');
    expect((props.record as any).title).toBe('Current popup record');
    expect((props.record as any).hasChildren).toBe(true);
  });

  it('treats views with openerUids as popup (meta visible)', async () => {
    const { ctx } = makeCtx();

    // openerUids 作为路由栈缺失时的兜底标记：即使没有 navigation.viewStack，也应展示 ctx.popup 元信息
    const anchorView: FlowView = {
      type: 'dialog',
      inputArgs: {
        openerUids: ['opener-uid-1'],
        viewUid: 'popup-uid',
        dataSourceKey: 'main',
        collectionName: 'posts',
        filterByTk: 1,
      },
      Header: null,
      Footer: null,
      close: () => void 0,
      update: () => void 0,
    } as any;

    const meta = (await createPopupMeta(ctx, anchorView)())!;
    expect(typeof meta.hidden).toBe('function');
    expect((meta.hidden as any)()).toBe(false);
    expect(typeof meta.disabled).toBe('function');
    expect((meta.disabled as any)()).toBe(false);

    const vars = (await meta.buildVariablesParams!(ctx)) as any;
    expect(vars).toBeTruthy();
    expect(vars.record).toEqual({
      collection: 'posts',
      dataSourceKey: 'main',
      filterByTk: 1,
      associationName: undefined,
      sourceId: undefined,
    });
  });

  it('does not expose popup.record without filterByTk', async () => {
    const { ctx } = makeCtx();

    const anchorView: FlowView = {
      type: 'dialog',
      inputArgs: {
        openerUids: ['opener-uid-1'],
        viewUid: 'popup-uid',
        dataSourceKey: 'main',
        collectionName: 'posts',
        // filterByTk 缺失：不应展示“当前弹窗记录”变量
      },
      Header: null,
      Footer: null,
      close: () => void 0,
      update: () => void 0,
    } as any;

    ctx.defineProperty('view', { value: anchorView });

    const meta = (await createPopupMeta(ctx, anchorView)())!;
    const props = typeof meta.properties === 'function' ? await (meta.properties as any)() : meta.properties || {};
    expect(props.record).toBeUndefined();
  });
});
