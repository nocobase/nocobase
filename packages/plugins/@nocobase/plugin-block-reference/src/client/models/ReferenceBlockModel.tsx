/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Result, Empty, Card } from 'antd';
import { escapeT, FlowEngine, FlowModel, FlowModelRenderer, createBlockScopedEngine } from '@nocobase/flow-engine';
import { tStr, NAMESPACE } from '../locale';
import { BlockModel } from '@nocobase/client';

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
    return <FlowModelRenderer key={target.uid} model={target} showFlowSettings={false} showErrorFallback />;
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

        // 3) 在本地创建新实例（挂到同一父与 subKey），并插入到相同位置
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

        if (subType === 'array') {
          let arr = (parent.subModels as any)[subKey] as FlowModel[] | undefined;
          if (!Array.isArray(arr)) {
            (parent.subModels as any)[subKey] = [];
            arr = (parent.subModels as any)[subKey] as FlowModel[];
          }
          const finalIndex = Math.min(Math.max(insertIndex, 0), arr.length);
          arr.splice(finalIndex, 0, newModel);
          arr.forEach((m, idx) => (m.sortIndex = idx));
          (parent as any).emitter?.emit?.('onSubModelAdded', newModel);
          // 针对 GridModel 等，主动触发一次 rows 合并确保界面即时可见
          if (typeof (parent as any).resetRows === 'function') {
            (parent as any).resetRows(true);
          }
        } else {
          parent.setSubModel(subKey, newModel);
        }

        const isPresetOrNew = !!(oldModel as any).isNew;
        // 4) 预设/新建：需要先保证父模型在服务端存在，再保存新实例
        if (isPresetOrNew) {
          const parentExists = await (engine.modelRepository as any).findOne?.({ uid: parent.uid });
          if (!parentExists) {
            await parent.save();
          }
        }
        await newModel.save();

        if (isPresetOrNew) {
          // 5a) 预设/新建场景：仅本地移除旧实例，不调用持久化删除
          engine.removeModel(oldModel.uid);
          // 确保新副本在正确位置（如有同级已持久化兄弟节点，进行一次相对移动来固定顺序）
          if (subType === 'array' && engine.modelRepository) {
            const arr = ((parent.subModels as any)[subKey] || []) as FlowModel[];
            // 优先选用“后一个”兄弟作为锚点（before），否则用“前一个”（after）
            const afterSibling = arr[insertIndex + 1];
            const beforeSibling = arr[insertIndex - 1];
            let moved = false;
            if (afterSibling) {
              const exists = await (engine.modelRepository as any).findOne?.({ uid: afterSibling.uid });
              if (exists && typeof (engine.modelRepository as any).move === 'function') {
                await (engine.modelRepository as any).move(newModel.uid, afterSibling.uid, 'before');
                moved = true;
              }
            }
            if (!moved && beforeSibling) {
              const exists = await (engine.modelRepository as any).findOne?.({ uid: beforeSibling.uid });
              if (exists && typeof (engine.modelRepository as any).move === 'function') {
                await (engine.modelRepository as any).move(newModel.uid, beforeSibling.uid, 'after');
                moved = true;
              }
            }
          }
          // 将父模型的布局参数持久化（如 GridModel 的 rows/sizes），避免刷新后丢失
          await parent.saveStepParams();
        } else {
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
