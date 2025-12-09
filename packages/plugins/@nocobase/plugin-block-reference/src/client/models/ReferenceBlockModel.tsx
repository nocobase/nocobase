/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import _ from 'lodash';
import { Result, Empty, Card } from 'antd';
import {
  escapeT,
  FlowEngine,
  FlowModel,
  FlowModelRenderer,
  createBlockScopedEngine,
  FlowEngineProvider,
  FlowViewContextProvider,
  FlowContext,
  useFlowViewContext,
} from '@nocobase/flow-engine';
import { tStr, NAMESPACE } from '../locale';
import { BlockModel } from '@nocobase/client';

// 桥接父视图上下文：
// - 复用父级的 view/popup 等视图变量；
// - 同时将 ctx.engine 指向 block 作用域引擎，保证实例/缓存隔离。
const RefViewBridge: React.FC<{ engine: FlowEngine; model: FlowModel }> = ({ engine, model }) => {
  const parentViewCtx = useFlowViewContext();
  const viewCtx = React.useMemo(() => {
    const c = new FlowContext();
    c.defineProperty('engine', { value: engine });
    c.addDelegate(engine.context);
    // 继承父级视图上下文（若存在），获取 ctx.view / ctx.popup 等变量与元信息
    if (parentViewCtx && parentViewCtx instanceof FlowContext) {
      c.addDelegate(parentViewCtx);
    }
    return c;
  }, [engine, parentViewCtx]);
  return (
    <FlowViewContextProvider context={viewCtx}>
      <FlowModelRenderer key={model.uid} model={model} showFlowSettings={false} showErrorFallback />
    </FlowViewContextProvider>
  );
};

/**
 * ReferenceBlockModel（插件版）
 * - 通过配置 targetUid（实例 model.uid）引用并渲染另一个区块；
 * - 在 BlockScoped 引擎中实例化目标区块，隔离模型实例与事件缓存；
 * - 与目标区块建立父子关系（目标仅作为 Reference 的子模型用于设置菜单聚合，不做持久化）；
 * - 当目标缺失/非法/循环时，渲染占位提示；
 * - 标题为：目标标题 + (Reference)。
 */
export class ReferenceBlockModel extends BlockModel {
  constructor(options: any) {
    super(options);
    // 通过 Proxy 将未知属性/方法转发到目标模型：
    // - 若属性/方法在本实例（含原型链）已存在，则不代理；
    // - 若不存在且已解析出 _targetModel，则从目标模型读取；函数按目标模型上下文绑定；
    // - 支持写入：未知属性写入目标模型（若存在对应键）；否则写回自身。
    const proxy = new Proxy(this as any, {
      get(target, prop: string | symbol, receiver) {
        if (prop === '__isReferenceProxy') return true;
        if (prop in target) {
          // 自身已有（含原型链）则直接返回；若为函数需绑定到 target，避免 private field 访问报错
          const val = Reflect.get(target, prop, target);
          if (typeof val === 'function' && prop !== 'constructor') {
            return val.bind(target);
          }
          return val;
        }
        const t = target._targetModel as any;
        if (t) {
          const val = Reflect.get(t, prop, t);
          if (typeof val === 'function' && prop !== 'constructor') {
            return val.bind(t);
          }
          if (val !== undefined) return val;
        }
        return undefined;
      },
      set(target, prop: string | symbol, value, receiver) {
        if (prop in target) {
          return Reflect.set(target, prop, value, target);
        }
        const t = target._targetModel as any;
        if (t && prop in t) {
          return Reflect.set(t, prop, value, t);
        }
        return Reflect.set(target, prop, value, target);
      },
      has(target, prop: string | symbol) {
        if (prop in target) return true;
        const t = target._targetModel as any;
        return !!t && prop in t;
      },
      ownKeys(target) {
        const keys = new Set(Reflect.ownKeys(target));
        const t = target._targetModel as any;
        if (t) {
          for (const k of Reflect.ownKeys(t)) keys.add(k);
        }
        return Array.from(keys);
      },
      getOwnPropertyDescriptor(target, prop: string | symbol) {
        const desc = Reflect.getOwnPropertyDescriptor(target, prop);
        if (desc) return desc;
        const t = target._targetModel as any;
        if (!t) return undefined;
        return Object.getOwnPropertyDescriptor(t, prop) || undefined;
      },
    });
    return proxy as any;
  }
  public settingsMenuLevel = 2;
  private _scopedEngine?: FlowEngine;
  private _targetModel?: FlowModel;
  private _resolvedTargetUid?: string;

  get title() {
    if (this._targetModel?.title) {
      const refLabel = this.translate?.('Reference', { ns: [NAMESPACE, 'client'] }) || 'Reference';
      return `${this._targetModel.title} (${refLabel})`;
    }
    return super.title;
  }

  onInit(option) {
    super.onInit(option);
    this.context.defineProperty('refModel', {
      get: () => this._targetModel,
      cache: false,
    });
  }

  private _getTargetUidFromParams(): string | undefined {
    const p = this.getStepParams('referenceSettings', 'target') || {};
    return (p?.targetUid || '').trim() || undefined;
  }

  private _ensureScopedEngine(): FlowEngine {
    if (!this._scopedEngine) {
      this._scopedEngine = createBlockScopedEngine(this.flowEngine);
    }
    return this._scopedEngine;
  }

  /**
   * 解析最终目标模型：
   * - 支持 reference-of-reference 扁平化（直到非 ReferenceBlockModel）；
   * - 简单循环检测（A→B→A 等）；
   * - 目标缺失或非法时返回 null。
   */
  private async _resolveFinalTarget(uid: string): Promise<FlowModel | null> {
    const engine = this._ensureScopedEngine();
    const visited = new Set<string>();
    let currentUid = uid;
    for (let i = 0; i < 20; i++) {
      if (!currentUid) return null;
      if (visited.has(currentUid) || currentUid === this.uid) {
        return null;
      }
      visited.add(currentUid);

      const model = await engine.loadModel<FlowModel>({ uid: currentUid });
      if (!model) return null;

      const isReference = model.constructor.name === 'ReferenceBlockModel';
      if (!isReference) {
        return model;
      }

      const next = model.getStepParams('referenceSettings', 'target')?.targetUid;
      if (!next || typeof next !== 'string' || !next.trim()) {
        return null;
      }
      currentUid = String(next).trim();
    }
    return null;
  }

  public async onDispatchEventStart(eventName: string): Promise<void> {
    if (eventName !== 'beforeRender') return;
    const stepParams = (this.getStepParams as any)?.('referenceSettings', 'target') || {};
    const targetUid = (stepParams?.targetUid || '').trim() || undefined;
    if (!targetUid) {
      const oldTarget: FlowModel | undefined = (this.subModels as any)['target'];
      if (oldTarget) {
        (this as any).emitter?.emit?.('onSubModelRemoved', oldTarget);
        this._scopedEngine?.removeModel(oldTarget.uid);
      }
      this._targetModel = undefined;
      this._resolvedTargetUid = undefined;
      (this.subModels as any)['target'] = undefined;
      return;
    }
    if (this._resolvedTargetUid === targetUid && this._targetModel) {
      return;
    }
    const target = await this._resolveFinalTarget(targetUid);
    if (!target) {
      const oldTarget: FlowModel | undefined = (this.subModels as any)['target'];
      if (oldTarget) {
        (this as any).emitter?.emit?.('onSubModelRemoved', oldTarget);
        this._scopedEngine?.removeModel(oldTarget.uid);
      }
      this._targetModel = undefined;
      this._resolvedTargetUid = undefined;
      (this.subModels as any)['target'] = undefined;
      return;
    }

    target.setParent(this);
    const oldTarget: FlowModel | undefined = (this.subModels as any)['target'];
    if (oldTarget?.uid !== target.uid) {
      this.setSubModel('target', target);
      if (oldTarget) {
        this._scopedEngine?.removeModel(oldTarget.uid);
      }
    } else {
      (this.subModels as any)['target'] = target;
      (this as any).emitter?.emit?.('onSubModelReplaced', { oldModel: oldTarget, newModel: target });
    }

    this._targetModel = target;
    this._resolvedTargetUid = targetUid;
    this.rerender();
  }

  async destroy(): Promise<boolean> {
    this._scopedEngine?.unlinkFromStack?.();
    this._scopedEngine = undefined;
    return await super.destroy();
  }

  /**
   * 重写 serialize 方法，排除 target 子模型的序列化
   * 这样在保存引用区块时不会连带保存目标区块，避免破坏目标区块的父子关系
   */
  serialize(): Record<string, any> {
    const data = super.serialize();
    // 从序列化结果中移除 target 子模型
    if (data.subModels && 'target' in data.subModels) {
      delete data.subModels.target;
      // 如果 subModels 为空对象，也删除它
      if (Object.keys(data.subModels).length === 0) {
        delete data.subModels;
      }
    }
    return data;
  }

  renderComponent() {
    const target: FlowModel | undefined = (this.subModels as any)?.['target'];
    const configuredUid = this._getTargetUidFromParams();
    if (!target) {
      if (!configuredUid) {
        return (
          <Card>
            <div style={{ padding: 24 }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  this.translate?.('Please configure target block', { ns: [NAMESPACE, 'client'] }) ||
                  'Please configure target block'
                }
              />
            </div>
          </Card>
        );
      }
      return (
        <Card>
          <div style={{ padding: 24 }}>
            <Result
              status="error"
              subTitle={
                this.translate?.('Target block is invalid', { ns: [NAMESPACE, 'client'] }) || 'Target block is invalid'
              }
            />
          </div>
        </Card>
      );
    }
    // 使用 BlockScoped 引擎包裹渲染，确保拖拽/移动等操作拿到正确的 engine
    const engine = this._ensureScopedEngine();
    return (
      <FlowEngineProvider engine={engine}>
        <RefViewBridge engine={engine} model={target} />
      </FlowEngineProvider>
    );
  }

  public render(): any {
    return <div ref={this.context.ref}>{this.renderComponent()}</div>;
  }
}

ReferenceBlockModel.registerFlow({
  key: 'referenceSettings',
  sort: -999,
  title: tStr('Reference block'),
  steps: {
    target: {
      preset: true,
      title: tStr('Reference settings'),
      uiSchema: (ctx) => {
        const m = (ctx.model as any) || {};
        const step = m.getStepParams?.('referenceSettings', 'target') || {};
        const uid = (step?.targetUid || '').trim();
        const isNew = !!m.isNew;
        const hasConfigured = !!uid;
        // 更精准的有效性判断：要求已解析的 _targetModel 存在且与当前 uid 匹配
        const resolvedUid = m._resolvedTargetUid;
        const resolvedModel = m._targetModel;
        const hasValidTarget = !!resolvedModel && resolvedUid === uid;
        const disableUid = !isNew && hasConfigured && hasValidTarget;
        return {
          targetUid: {
            title: tStr('Block UID'),
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-decorator-props': {
              tooltip: disableUid ? tStr('Block UID is already set and cannot be modified') : undefined,
            },
            'x-component-props': {
              disabled: disableUid,
            },
            'x-validator': [
              {
                format: 'string',
                required: true,
              },
            ],
          },
          mode: {
            title: tStr('Reference mode'),
            'x-component': 'Radio.Group',
            'x-decorator': 'FormItem',
            enum: [
              { label: tStr('Reference'), value: 'reference' },
              { label: tStr('Copy'), value: 'copy' },
            ],
          },
          copyNotice: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'Alert',
            'x-component-props': {
              type: 'warning',
              showIcon: true,
              message: tStr('Some configurations using uid may need to be reconfigured'),
            },
            'x-reactions': {
              dependencies: ['mode'],
              fulfill: {
                state: {
                  hidden: '{{$deps[0] !== "copy"}}',
                },
              },
            },
          },
        };
      },
      defaultParams() {
        return { mode: 'reference' };
      },
      async beforeParamsSave(ctx, params) {
        const v = (params?.targetUid || '').trim();
        const mode = params?.mode || 'reference';
        if (mode !== 'copy' || !v) return;
        const engine = ctx.engine;
        // 1) 先在服务端复制目标模型，得到新的根节点 JSON（含新 uid）
        const duplicated = await engine.duplicateModel(v);
        if (!duplicated) return;

        // 2) 计算父模型与原位置
        const oldModel = ctx.model as FlowModel;
        const parent = oldModel.parent as FlowModel | undefined;
        const subKey = oldModel.subKey as string;
        const subType = (oldModel as any).subType as 'array' | 'object';

        // 若没有父模型，直接退出（无处安放新实例）
        if (!parent || !subKey) {
          ctx.exit();
          return;
        }

        let insertIndex = -1;
        if (subType === 'array') {
          const arr = ((parent.subModels as any)[subKey] || []) as FlowModel[];
          insertIndex = Array.isArray(arr) ? arr.findIndex((m) => m?.uid === oldModel.uid) : -1;
          if (insertIndex < 0) insertIndex = arr.length;
        }

        // 3) 在本地创建新实例（挂到同一父与 subKey）
        const newOptions = {
          ...duplicated,
          parentId: parent.uid,
          subKey,
          subType,
        } as any;
        const newModel = engine.createModel<FlowModel>(newOptions);
        // 标记为新建，触发如 GridModel 等父容器在 onSubModelAdded 中进行布局/rows 初始化
        (newModel as any).isNew = true;
        newModel.setParent(parent);

        const isPresetOrNew = !!(oldModel as any).isNew;
        // 4) 预设/新建 与 已持久化 分支分别处理（仅非 replace 分支改动，replace 分支沿用原位替换逻辑）
        if (isPresetOrNew) {
          // 非 replace：通过 addSubModel 触发 onSubModelAdded，让 Grid 追加到最后一行
          if (subType === 'array') {
            parent.addSubModel(subKey, newModel);
            await (newModel as any).afterAddAsSubModel?.();
          } else {
            parent.setSubModel(subKey, newModel);
            await (newModel as any).afterAddAsSubModel?.();
          }
          // 4.1 确保父模型已存在
          const parentExists = await (engine.modelRepository as any)?.findOne?.({ uid: parent.uid });
          if (!parentExists) {
            await parent.save();
          }
          // 4.2 确保旧实例作为锚点已持久化
          const oldExists = await (engine.modelRepository as any)?.findOne?.({ uid: oldModel.uid });
          if (!oldExists) {
            await (oldModel as any).save?.();
          }
          // 4.3 保存新实例
          await newModel.save();
          (newModel as any).isNew = false;
          // 4.4 在后端以旧实例为锚点移动新实例到目标位置，从而建立父子与排序
          if (subType === 'array' && (engine.modelRepository as any)?.move) {
            await (engine.modelRepository as any).move(newModel.uid, oldModel.uid, 'before');
          }
          // 4.5 销毁旧实例（持久化）
          await engine.destroyModel(oldModel.uid);
          // 4.6 保存父模型的布局
          await parent.saveStepParams();
        } else {
          // replace：保持当前位置不变——手动插入到与旧实例相同的索引，并更新 rows 将旧 uid 替换为新 uid
          if (subType === 'array') {
            let arr = (parent.subModels as any)[subKey] as FlowModel[] | undefined;
            if (!Array.isArray(arr)) {
              (parent.subModels as any)[subKey] = [];
              arr = (parent.subModels as any)[subKey] as FlowModel[];
            }
            const finalIndex = Math.min(Math.max(insertIndex, 0), arr.length);
            arr.splice(finalIndex, 0, newModel);
            arr.forEach((m, idx) => (m.sortIndex = idx));

            // 替换 Grid rows 中的 uid，保持原位置
            const gridParams = parent.getStepParams('gridSettings', 'grid') || {};
            if (gridParams?.rows && typeof gridParams.rows === 'object') {
              const newRows = _.cloneDeep(gridParams.rows);
              for (const rowId of Object.keys(newRows)) {
                const columns = newRows[rowId];
                if (Array.isArray(columns)) {
                  for (let ci = 0; ci < columns.length; ci++) {
                    const col = columns[ci];
                    if (Array.isArray(col)) {
                      for (let ii = 0; ii < col.length; ii++) {
                        if (col[ii] === oldModel.uid) {
                          col[ii] = newModel.uid;
                        }
                      }
                    }
                  }
                }
              }
              parent.setStepParams('gridSettings', 'grid', { rows: newRows, sizes: gridParams.sizes || {} });
              parent.setProps('rows', newRows);
            }
            await (newModel as any).afterAddAsSubModel?.();
          } else {
            parent.setSubModel(subKey, newModel);
            await (newModel as any).afterAddAsSubModel?.();
          }

          // 5) 已持久化场景：先保存新实例、再相对移动并删除旧实例，最后只保存布局参数
          await newModel.save();
          (newModel as any).isNew = false;
          // 5b) 已持久化场景：若为数组子模型，则在服务端相对移动保持原位置；随后销毁旧实例
          if (subType === 'array' && engine.modelRepository) {
            const targetExists = await (engine.modelRepository as any).findOne({ uid: oldModel.uid });
            if (targetExists && typeof (engine.modelRepository as any).move === 'function') {
              await (engine.modelRepository as any).move(newModel.uid, oldModel.uid, 'before');
            }
          }
          await engine.destroyModel(oldModel.uid);
          // 持久化父模型的布局参数
          await parent.saveStepParams();
        }

        // 关闭设置视图
        ctx.exit();
      },
    },
  },
});

ReferenceBlockModel.registerFlow({
  key: 'cardSettings',
  steps: {}, // 隐藏自身的block配置
});

ReferenceBlockModel.define({
  label: tStr('Reference block'),
  group: escapeT('Other blocks'),
  createModelOptions: {
    use: 'ReferenceBlockModel',
  },
  sort: 900,
});
