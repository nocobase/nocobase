/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowRunJSContext } from '../../flowContext';
import { FlowModelRenderer } from '../../components/FlowModelRenderer';

export class JSBlockRunJSContext extends FlowRunJSContext {
  constructor(delegate: any) {
    super(delegate);
    // 暴露渲染器，JS 内可直接渲染模型
    this.defineProperty('FlowModelRenderer', { value: FlowModelRenderer });
    // 一行式渲染：默认采用“引擎镜像”（隔离引擎 + serialize 整树复制）
    this.defineMethod(
      'renderModel',
      async (
        arg:
          | string
          | {
              uid?: string;
              isolate?: 'engine' | 'view' | 'block' | 'fork';
              filterGroups?: any[];
              showFlowSettings?: boolean;
              showTitle?: boolean;
              mount?: HTMLElement;
              mountStyle?: Partial<CSSStyleDeclaration>;
            },
      ) => {
        const opts = typeof arg === 'string' ? { uid: arg } : arg || {};
        const uid = opts.uid || (this.view?.inputArgs as any)?.targetUid || (this.view?.inputArgs as any)?.uid;
        if (!uid) throw new Error('renderModel: uid is required');

        const isolateKind = opts.isolate; // 默认 undefined => 镜像
        let model: any;
        let engine = (this as any).engine as any;

        if (isolateKind === 'fork') {
          // 兼容：fork（不推荐，仅保留旧用法）
          const master = engine.getModel(uid) || (await engine.loadModel({ uid }));
          if (!master) throw new Error(`renderModel: master model not found by uid '${uid}'`);
          const fork = master.createFork({}, undefined, { register: true });
          model = fork;
        } else {
          // 默认：引擎镜像
          const scoped = await (this as any).createIsolatedEngine?.('block');
          if (!scoped) throw new Error('renderModel: failed to create isolated engine');
          engine = scoped;
          const master = (this as any).engine.getModel(uid) || (await (this as any).engine.loadModel({ uid }));
          if (!master) throw new Error(`renderModel: master model not found by uid '${uid}'`);
          const serialized = master.serialize();
          const mirror = engine.createModel(serialized as any);
          model = mirror;
        }

        const mount = opts.mount || document.createElement('div');
        if (!opts.mount) {
          try {
            (mount.style as any).margin = '12px 0';
          } catch (_) {
            /* noop */
          }
          (this as any).element?.appendChild?.(mount);
        }
        if (opts.mountStyle) Object.assign(mount.style, opts.mountStyle);

        const root = (engine || (this as any).engine).reactView.createRoot(mount);
        root.render(
          (this as any).React.createElement(FlowModelRenderer, {
            model,
            showFlowSettings: !!opts.showFlowSettings,
            showTitle: !!opts.showTitle,
          }),
        );

        // 记录引用，便于清理
        try {
          const hostModel = (this as any)?.model;
          hostModel._isolatedChildren = hostModel._isolatedChildren || [];
          hostModel._isolatedChildren.push({ uid, engine, model, root, mount });
        } catch (_) {
          /* noop */
        }

        return { engine, model, root, mount };
      },
    );
  }
}

JSBlockRunJSContext.define({
  label: 'RunJS context',
  properties: {
    element: {
      description: `ElementProxy instance providing a safe DOM container.
      Supports innerHTML, append, and other DOM manipulation methods.
      Use this to render content in the JS block.`,
      detail: 'ElementProxy',
      properties: {
        innerHTML: 'Set or read the HTML content of the container element.',
      },
    },
    record: `Current record data object (read-only).
      Available when the JS block is within a data block or detail view context.`,
    value: 'Current value of the field or component, if available in the current context.',
    React: 'React library',
    antd: 'Ant Design library',
  },
  methods: {
    onRefReady: `Wait for container DOM element to be ready before executing callback.
      Parameters: (ref: React.RefObject, callback: (element: HTMLElement) => void, timeout?: number) => void
      Example: ctx.onRefReady(ctx.ref, (el) => { el.innerHTML = "Ready!" })`,
    requireAsync: 'Load external library: `const lib = await ctx.requireAsync(url)`',
    importAsync: 'Dynamically import ESM module: `const mod = await ctx.importAsync(url)`',
    renderModel:
      'Render another block model inside JSBlock. Default uses engine-mirror (isolated engine + serialize).\n' +
      'Usage: `await ctx.renderModel(uidOrOptions)`',
  },
});

JSBlockRunJSContext.define(
  {
    label: 'RunJS 上下文',
    properties: {
      element: {
        description: 'ElementProxy，安全的 DOM 容器，支持 innerHTML/append 等',
        detail: 'ElementProxy',
        properties: {
          innerHTML: '读取或设置容器的 HTML 内容',
        },
      },
      record: '当前记录（只读，用于数据区块/详情等场景）',
      value: '当前值（若存在）',
      React: 'React 库',
      antd: 'Ant Design 库',
    },
    methods: {
      onRefReady: '容器 ref 就绪回调：\n```js\nctx.onRefReady(ctx.ref, el => { /* ... */ })\n```',
      requireAsync: '加载外部库：`const lib = await ctx.requireAsync(url)`',
      importAsync: '按 URL 动态导入 ESM 模块：`const mod = await ctx.importAsync(url)`',
      renderModel:
        '在 JSBlock 内渲染其它区块（默认使用引擎镜像：隔离引擎 + serialize）。\n' +
        '用法：`await ctx.renderModel(uidOrOptions)`',
    },
  },
  { locale: 'zh-CN' },
);
