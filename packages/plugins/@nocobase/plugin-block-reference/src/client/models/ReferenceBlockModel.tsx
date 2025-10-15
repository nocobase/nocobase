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
import { uid as genUid } from '@formily/shared';
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

  get resource(): any {
    return (this._targetModel as any)?.resource;
  }

  async getFilterFields(): Promise<any[]> {
    const t = this._targetModel as any;
    if (t?.getFilterFields) {
      return await t.getFilterFields();
    }
    return [];
  }

  private _getTargetUidFromParams(): string | undefined {
    const p = (this.getStepParams as any)?.('referenceSettings', 'target') || {};
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

      const isReference = (model.constructor as any)?.name === 'ReferenceBlockModel';
      if (!isReference) {
        return model;
      }

      const next = (model as any)?.getStepParams?.('referenceSettings', 'target')?.targetUid;
      if (!next || typeof next !== 'string' || !next.trim()) {
        return null;
      }
      currentUid = String(next).trim();
    }
    return null;
  }

  public async onDispatchEventStart(eventName: string): Promise<void> {
    if (eventName !== 'beforeRender') return;
    const targetUid = this._getTargetUidFromParams();
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
    this.context.defineProperty('collection', {
      get: () => (target as any)?.context?.collection,
      cache: false,
    });
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
        };
      },
      defaultParams() {
        return { mode: 'reference' };
      },
      async handler(ctx, params) {
        const v = (params?.targetUid || '').trim();
        const mode = params?.mode || 'reference';
        if (!v) {
          ctx.model.setStepParams('referenceSettings', 'target', { targetUid: '' });
          return;
        }
        if (mode === 'copy') {
          try {
            const engine = ctx.model.flowEngine;
            const source = engine.getModel(v) || (await engine.loadModel({ uid: v }));
            if (!source) return;
            const json = source.serialize();
            const set = new Set<string>();
            const collect = (node: any) => {
              if (!node || typeof node !== 'object') return;
              if (typeof node.uid === 'string') set.add(node.uid);
              const sms = node.subModels;
              if (sms && typeof sms === 'object') {
                for (const key of Object.keys(sms)) {
                  const val = (sms as any)[key];
                  if (Array.isArray(val)) val.forEach((child) => collect(child));
                  else if (val && typeof val === 'object') collect(val);
                }
              }
            };
            collect(json);
            const map = new Map<string, string>();
            map.set(json.uid, ctx.model.uid);
            set.forEach((oldId) => {
              if (oldId === json.uid) return;
              map.set(oldId, genUid());
            });
            let str = JSON.stringify(json);
            for (const [oldId, newId] of map.entries()) {
              const re = new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
              str = str.replace(re, newId);
            }
            const newJson = JSON.parse(str);
            const newModel = await engine.replaceModel(ctx.model.uid, newJson);
            newModel.invalidateFlowCache?.('beforeRender', true);
            await newModel.dispatchEvent?.('beforeRender', undefined, { useCache: false, sequential: true });
            ctx.exit();
            return;
          } catch (e) {
            console.error('[ReferenceBlockModel] copy mode failed:', e);
          }
        }
        ctx.model.setStepParams('referenceSettings', 'target', { targetUid: v });
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
