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
import { type CreateModelOptions, FlowContext, FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { REF_HOST_CTX_KEY } from '../constants';
import { NAMESPACE } from '../locale';
import {
  ensureBlockScopedEngine,
  ReferenceScopedRenderer,
  renderReferenceTargetPlaceholder,
  ensureScopedEngineView,
  unlinkScopedEngine,
} from './referenceShared';

const SETTINGS_FLOW_KEY = 'referenceSettings';
const SETTINGS_STEP_KEY = 'useTemplate';

/** 标记已添加 host context bridge，避免重复添加 */
const BRIDGE_MARKER = Symbol.for('nocobase.refGridHostBridge');

export type ReferenceFormGridTargetSettings = {
  /** 模板 uid（flowModelTemplates.uid） */
  templateUid: string;
  /** 模板名称（用于 UI 展示，可选） */
  templateName?: string;
  /** 模板根区块 uid（flowModels.uid） */
  targetUid: string;
  /** 从模板根上取片段的路径，当前仅支持 'subModels.grid' */
  targetPath?: string;
};

export class ReferenceFormGridModel extends FlowModel {
  private _scopedEngine?: FlowEngine;
  private _targetRoot?: FlowModel;
  private _targetGrid?: FlowModel;
  private _resolvedTargetUid?: string;
  private _invalidTargetUid?: string;

  /**
   * 字段模板场景下，模板内 FormItemModel/CollectionFieldModel 的 onInit 会调用 ctx.blockModel.addAppends(fieldPath)。
   * 但模板 root 自身也是一个 CollectionBlockModel，会在未桥接宿主上下文时被识别为 blockModel，导致 appends 写到模板 root 的 resource，
   * 从而宿主表单（如 ApplyFormModel）在刷新记录时缺少关联 appends（例如 users.roles）。
   *
   * 这里在目标 grid 解析完成后扫描字段路径，并把需要的 appends 同步到宿主 block（master + forks），确保关系数据可展示。
   */
  private _syncHostResourceAppends(host: FlowModel, targetGrid: FlowModel) {
    if (!host['addAppends']) {
      return;
    }
    const candidates = new Set<string>();
    const addCandidate = (val: unknown) => {
      const s = typeof val === 'string' ? val.trim() : '';
      if (!s) return;
      candidates.add(s);
      const top = s.split('.')[0]?.trim();
      if (top) candidates.add(top);
    };

    const visit = (m: FlowModel) => {
      const init = m.getStepParams?.('fieldSettings', 'init') as
        | { fieldPath?: string; associationPathName?: string }
        | undefined;
      if (init) {
        addCandidate(init.fieldPath);
        addCandidate(init.associationPathName);
      }
      const subs = m.subModels || {};
      for (const v of Object.values(subs)) {
        if (Array.isArray(v)) {
          v.forEach((c) => c instanceof FlowModel && visit(c));
        } else if (v instanceof FlowModel) {
          visit(v);
        }
      }
    };

    visit(targetGrid);
    if (candidates.size === 0) return;
    for (const fieldPath of candidates) {
      (host as any).addAppends?.(fieldPath);
    }
  }

  constructor(options: any) {
    super(options);

    const forwardedReadMethods = new Set<string>(['mapSubModels', 'filterSubModels', 'findSubModel', 'hasSubModel']);

    const proxy = new Proxy(this as any, {
      get(target, prop: string | symbol) {
        const t = target._targetGrid as FlowModel | undefined;
        if (t) {
          if (prop === 'subModels') return t.subModels;
          if (typeof prop === 'string' && forwardedReadMethods.has(prop)) {
            const val = Reflect.get(t as any, prop, t as any);
            return typeof val === 'function' ? val.bind(t) : val;
          }
        }

        if (prop in target) {
          const val = Reflect.get(target, prop, target);
          if (typeof val === 'function' && prop !== 'constructor') {
            return val.bind(target);
          }
          return val;
        }

        if (t) {
          const val = Reflect.get(t as any, prop, t as any);
          if (typeof val === 'function' && prop !== 'constructor') {
            return val.bind(t);
          }
          if (val !== undefined) return val;
        }

        return undefined;
      },
      has(target, prop: string | symbol) {
        if (prop in target) return true;
        const t = target._targetGrid as FlowModel | undefined;
        return !!t && prop in t;
      },
      ownKeys(target) {
        const keys = new Set(Reflect.ownKeys(target));
        const t = target._targetGrid as FlowModel | undefined;
        if (t) {
          for (const k of Reflect.ownKeys(t)) keys.add(k);
        }
        return Array.from(keys);
      },
      getOwnPropertyDescriptor(target, prop: string | symbol) {
        const desc = Reflect.getOwnPropertyDescriptor(target, prop);
        if (desc) return desc;
        const t = target._targetGrid as FlowModel | undefined;
        if (!t) return undefined;
        return Object.getOwnPropertyDescriptor(t, prop) || undefined;
      },
    });

    return proxy as any;
  }

  private _ensureScopedEngine(): FlowEngine {
    this._scopedEngine = ensureBlockScopedEngine(this.flowEngine, this._scopedEngine);
    return this._scopedEngine;
  }

  private _getTargetSettings(): ReferenceFormGridTargetSettings | undefined {
    const raw = this.getStepParams(SETTINGS_FLOW_KEY, SETTINGS_STEP_KEY);
    if (!raw || typeof raw !== 'object') return undefined;
    const templateUid = String((raw as any).templateUid || '').trim();
    const targetUid = String((raw as any).targetUid || '').trim();
    if (!templateUid || !targetUid) return undefined;
    const templateName = String((raw as any).templateName || '').trim() || undefined;
    const targetPath = String((raw as any).targetPath || '').trim() || undefined;
    return { templateUid, templateName, targetUid, targetPath };
  }

  private _syncHostExtraTitle(settings?: ReferenceFormGridTargetSettings) {
    const host = this.parent as FlowModel | undefined;
    if (!host) return;

    const master: any = (host as any)?.isFork ? (host as any).master || host : host;
    const targets: FlowModel[] = [host];
    if (master && master !== host && master instanceof FlowModel) targets.push(master);
    master?.forks?.forEach?.((f: any) => f instanceof FlowModel && targets.push(f));

    // 未配置时清空 extraTitle，回退为原有 title（不修改用户 title）
    if (!settings) {
      targets.forEach((m) => m.setExtraTitle(''));
      return;
    }

    const label = host.context.t('Reference template', { ns: [NAMESPACE, 'client'], nsMode: 'fallback' });
    const fieldsOnly = host.context.t('(Fields only)', { ns: [NAMESPACE, 'client'], nsMode: 'fallback' });
    const name = settings.templateName?.trim() || settings.templateUid?.trim() || '';
    const extra = name ? `${label}: ${name} ${fieldsOnly}` : `${label} ${fieldsOnly}`;

    targets.forEach((m) => m.setExtraTitle(extra.trim()));
  }

  addSubModel<T extends FlowModel>(subKey: string, options: CreateModelOptions | T) {
    if (!this._targetGrid) {
      throw new Error('[block-reference] Target grid is not resolved yet.');
    }
    return this._targetGrid.addSubModel(subKey, options);
  }

  setSubModel(subKey: string, options: CreateModelOptions | FlowModel) {
    if (!this._targetGrid) {
      throw new Error('[block-reference] Target grid is not resolved yet.');
    }
    return this._targetGrid.setSubModel(subKey, options);
  }

  getStepParams(flowKey: string, stepKey: string): any | undefined;
  getStepParams(flowKey: string): Record<string, any> | undefined;
  getStepParams(): Record<string, any>;
  getStepParams(flowKey?: string, stepKey?: string): any {
    if (!flowKey || flowKey === SETTINGS_FLOW_KEY) {
      return super.getStepParams(flowKey, stepKey);
    }

    if (!this._targetGrid) {
      // 未解析完成：允许读取本地 stepParams，避免配置对话框/中间态丢值
      return super.getStepParams(flowKey, stepKey);
    }

    if (stepKey) {
      const fromGrid = this._targetGrid.getStepParams(flowKey, stepKey);
      if (typeof fromGrid !== 'undefined') return fromGrid;
      return this._targetRoot?.getStepParams?.(flowKey, stepKey);
    }

    const gridFlow = this._targetGrid.getStepParams(flowKey) as any;
    const rootFlow = this._targetRoot?.getStepParams?.(flowKey) as any;
    if (rootFlow && typeof rootFlow === 'object') {
      return { ...rootFlow, ...(gridFlow || {}) };
    }
    return gridFlow;
  }

  setStepParams(flowKey: string, stepKey: string, params: any): void;
  setStepParams(flowKey: string, stepParams: Record<string, any>): void;
  setStepParams(allParams: Record<string, any>): void;
  setStepParams(flowKeyOrAllParams: any, stepKeyOrStepsParams?: any, params?: any): void {
    if (typeof flowKeyOrAllParams === 'string') {
      const flowKey = flowKeyOrAllParams;
      if (flowKey === SETTINGS_FLOW_KEY || !this._targetGrid) {
        super.setStepParams(flowKeyOrAllParams, stepKeyOrStepsParams, params);
        return;
      }
      if (typeof stepKeyOrStepsParams === 'string' && params !== undefined) {
        this._targetGrid.setStepParams(flowKey, stepKeyOrStepsParams, params);
        return;
      }
      if (typeof stepKeyOrStepsParams === 'object' && stepKeyOrStepsParams !== null) {
        this._targetGrid.setStepParams(flowKey, stepKeyOrStepsParams);
      }
      return;
    }

    if (typeof flowKeyOrAllParams === 'object' && flowKeyOrAllParams !== null) {
      const allParams = flowKeyOrAllParams as Record<string, any>;
      const localAll: Record<string, any> = {};
      const delegatedAll: Record<string, any> = {};
      for (const [fk, steps] of Object.entries(allParams)) {
        if (fk === SETTINGS_FLOW_KEY || !this._targetGrid) {
          localAll[fk] = steps;
        } else {
          delegatedAll[fk] = steps;
        }
      }
      if (Object.keys(localAll).length > 0) {
        super.setStepParams(localAll);
      }
      if (Object.keys(delegatedAll).length > 0 && this._targetGrid) {
        this._targetGrid.setStepParams(delegatedAll);
      }
    }
  }

  async saveStepParams() {
    // 如果目标尚未解析，先触发解析
    if (!this._targetGrid) {
      await this.dispatchEvent('beforeRender');
    }
    // 将本地非 settings 参数刷新到目标 grid
    if (this._targetGrid && this.stepParams) {
      for (const [flowKey, steps] of Object.entries(this.stepParams)) {
        if (flowKey === SETTINGS_FLOW_KEY || typeof steps !== 'object' || steps === null) continue;
        this._targetGrid.setStepParams(flowKey, steps as Record<string, any>);
        delete (this.stepParams as Record<string, any>)[flowKey];
      }
    }
    const res = await super.saveStepParams();
    if (this._targetGrid) {
      await this._targetGrid.saveStepParams();
    }
    return res;
  }

  public async onDispatchEventStart(eventName: string): Promise<void> {
    if (eventName !== 'beforeRender') return;

    const settings = this._getTargetSettings();
    if (!settings) {
      this._syncHostExtraTitle(undefined);
      this._targetRoot = undefined;
      this._targetGrid = undefined;
      this._resolvedTargetUid = undefined;
      this._invalidTargetUid = undefined;
      return;
    }

    this._syncHostExtraTitle(settings);

    const targetPath = settings.targetPath?.trim() || 'subModels.grid';
    if (targetPath !== 'subModels.grid') {
      throw new Error(
        `[block-reference] Only 'subModels.grid' is supported for ReferenceFormGridModel (got '${targetPath}').`,
      );
    }

    if (this._resolvedTargetUid === settings.targetUid && this._targetGrid) {
      // 已成功解析，清理 invalid 标记
      this._invalidTargetUid = undefined;
      return;
    }

    const engine = this._ensureScopedEngine();
    const host = this.parent as FlowModel | undefined;
    ensureScopedEngineView(engine, (host?.context as any) || (this.context as any));
    const targetUid = settings.targetUid;
    const prevTargetGrid = this._targetGrid;
    const prevResolvedTargetUid = this._resolvedTargetUid;
    const prevInvalidTargetUid = this._invalidTargetUid;
    // 进入解析流程时，先认为是“resolving”，避免渲染层误判为 invalid
    this._invalidTargetUid = undefined;

    // 在“模板引用”切换的中间态（例如模型树刚替换、上下文尚未稳定）下，
    // 可能出现首次解析不到目标（短暂返回 null/undefined）。这里做一次轻量重试，
    // 避免界面闪现 “Target block is invalid” 占位。
    const tryResolveTargetGrid = async (): Promise<{ root: FlowModel; grid: FlowModel } | undefined> => {
      const root = await engine.loadModel<FlowModel>({ uid: targetUid });
      if (!root) return undefined;

      root.setParent(host);
      const hostInfo = {
        hostUid: host?.uid,
        hostUse: host?.use,
        ref: {
          templateUid: settings.templateUid,
          templateName: settings.templateName,
          targetUid,
          targetPath,
          mountSubKey: 'grid',
          mode: 'reference',
        },
      };
      root.context.defineProperty(REF_HOST_CTX_KEY, { value: hostInfo });

      const fragment = root.subModels?.grid;
      let gridModel: FlowModel | undefined;
      if (fragment instanceof FlowModel) {
        gridModel = fragment;
      }
      // 将宿主区块上下文注入到被引用的 grid：
      // - Details 区块字段渲染依赖 ctx.record/resource/blockModel 等（定义在宿主 block context 上）；
      // - 但同时要保留 scoped engine（ctx.engine）指向，避免丢失实例/缓存隔离。
      // 注意：使用 Symbol 标记避免重复添加 delegate（beforeRender 可能多次触发）
      const contextWithMarker = gridModel?.context as (FlowContext & { [BRIDGE_MARKER]?: boolean }) | undefined;
      if (gridModel && host?.context && !contextWithMarker?.[BRIDGE_MARKER]) {
        const bridge = new FlowContext();
        bridge.defineProperty('engine', { value: engine });
        bridge.addDelegate(host.context);
        gridModel.context.addDelegate(bridge);
        (gridModel.context as FlowContext & { [BRIDGE_MARKER]?: boolean })[BRIDGE_MARKER] = true;
      }
      if (!gridModel) return undefined;
      // 同步模板字段需要的关联 appends 到宿主 block 的 resource（避免 users.roles 等关系字段为空）
      if (host) {
        this._syncHostResourceAppends(host, gridModel);
      }
      return { root, grid: gridModel };
    };

    let resolved = await tryResolveTargetGrid();
    if (!resolved) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const latest = this._getTargetSettings();
      if (latest?.targetUid !== targetUid) {
        return;
      }
      resolved = await tryResolveTargetGrid();
    }

    if (!resolved) {
      this._targetRoot = undefined;
      this._targetGrid = undefined;
      this._resolvedTargetUid = undefined;
      this._invalidTargetUid = targetUid;
      if (prevTargetGrid || prevResolvedTargetUid || prevInvalidTargetUid !== targetUid) {
        this.rerender();
      }
      return;
    }

    this._targetRoot = resolved.root;
    this._targetGrid = resolved.grid;
    this._resolvedTargetUid = targetUid;
    this._invalidTargetUid = undefined;

    if (prevTargetGrid !== resolved.grid || prevResolvedTargetUid !== targetUid || prevInvalidTargetUid) {
      this.rerender();
    }
  }

  clearForks() {
    try {
      this._syncHostExtraTitle(undefined);
      unlinkScopedEngine(this._scopedEngine);
    } finally {
      this._scopedEngine = undefined;
    }
    super.clearForks();
  }

  async destroy(): Promise<boolean> {
    try {
      unlinkScopedEngine(this._scopedEngine);
    } finally {
      this._scopedEngine = undefined;
    }
    return await super.destroy();
  }

  render() {
    const settings = this._getTargetSettings();
    if (!settings) {
      return renderReferenceTargetPlaceholder(this as any, 'unconfigured');
    }

    const target = this._targetGrid;
    if (!target) {
      if (this._invalidTargetUid === settings.targetUid) {
        return renderReferenceTargetPlaceholder(this as any, 'invalid');
      }
      // 目标尚未解析完成：展示 resolving，占位避免闪现 invalid
      return renderReferenceTargetPlaceholder(this as any, 'resolving');
    }

    const engine = this._ensureScopedEngine();
    return <ReferenceScopedRenderer engine={engine} model={target} />;
  }
}

ReferenceFormGridModel.define({
  hide: true,
});
