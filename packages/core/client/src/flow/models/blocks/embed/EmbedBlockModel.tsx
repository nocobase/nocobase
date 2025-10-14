/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { escapeT, FlowEngine, FlowModel, FlowModelRenderer, createBlockScopedEngine } from '@nocobase/flow-engine';
import { BlockModel } from '../../base/BlockModel';

/**
 * EmbedBlockModel
 * - 通过配置 targetUid（实例 model.uid）嵌入并渲染另一个区块；
 * - 在 BlockScoped 引擎中实例化目标区块，隔离模型实例与事件缓存；
 * - 与目标区块建立父子关系（目标作为 Embed 的子模型，仅用于设置菜单聚合，不做持久化）；
 * - 当目标缺失/非法/循环时，渲染占位提示；
 * - 标题为：目标标题 + (embed)。
 */
export class EmbedBlockModel extends BlockModel {
  // 仅 Embed 需要在一个齿轮菜单中展示自身 + 子模型（目标区块）的设置
  public settingsMenuLevel = 2;
  private _scopedEngine?: FlowEngine;
  private _targetModel?: FlowModel;
  private _resolvedTargetUid?: string;

  get title() {
    if (this._targetModel?.title) {
      const embedLabel = this.translate?.('引用');
      return `${this._targetModel.title} (${embedLabel})`;
    }
    return super.title;
  }

  /** 代理目标区块的资源，便于筛选器独立绑定 */
  get resource(): any {
    return (this._targetModel as any)?.resource;
  }

  /**
   * 供 FilterFormItemModel 使用：返回目标区块的可筛选字段
   */
  async getFilterFields(): Promise<any[]> {
    const t = this._targetModel as any;
    if (t?.getFilterFields) {
      return await t.getFilterFields();
    }
    return [];
  }

  /** 读取 embed 的 target 配置 */
  private _getTargetUidFromParams(): string | undefined {
    const p = (this.getStepParams as any)?.('embedSettings', 'target') || {};
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
   * - 支持 embed-of-embed 扁平化（直到非 EmbedBlockModel）；
   * - 简单循环检测（A→B→A 等）；
   * - 目标缺失或非法时返回 null。
   */
  private async _resolveFinalTarget(uid: string): Promise<FlowModel | null> {
    const engine = this._ensureScopedEngine();
    const visited = new Set<string>();
    let currentUid = uid;
    // 最多迭代 20 次防止意外死循环
    for (let i = 0; i < 20; i++) {
      if (!currentUid) return null;
      if (visited.has(currentUid) || currentUid === this.uid) {
        // 循环
        return null;
      }
      visited.add(currentUid);

      const model = await engine.loadModel<FlowModel>({ uid: currentUid });
      if (!model) return null;

      const isEmbed = (model.constructor as any)?.name === 'EmbedBlockModel';
      if (!isEmbed) {
        return model;
      }

      // 递归解析下一层 target
      const next = (model as any)?.getStepParams?.('embedSettings', 'target')?.targetUid;
      if (!next || typeof next !== 'string' || !next.trim()) {
        return null; // 非法/未配置
      }
      currentUid = String(next).trim();
    }
    return null;
  }

  /**
   * 在 beforeRender 之前确保目标模型实例可用，并作为子模型挂载。
   */
  public async onDispatchEventStart(eventName: string): Promise<void> {
    if (eventName !== 'beforeRender') return;
    const targetUid = this._getTargetUidFromParams();
    if (!targetUid) {
      const oldTarget: FlowModel | undefined = (this.subModels as any)['target'];
      if (oldTarget) {
        // 触发移除事件以便刷新菜单
        (this as any).emitter?.emit?.('onSubModelRemoved', oldTarget);
        // 从作用域引擎移除旧实例，避免泄漏
        this._scopedEngine?.removeModel(oldTarget.uid);
      }
      this._targetModel = undefined;
      this._resolvedTargetUid = undefined;
      (this.subModels as any)['target'] = undefined;
      return;
    }
    if (this._resolvedTargetUid === targetUid && this._targetModel) {
      return; // 未变化，无需重建
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

    // 建立父子关系（跨引擎），并作为子模型挂载（仅用于设置菜单聚合，不做持久化）
    target.setParent(this);
    const oldTarget: FlowModel | undefined = (this.subModels as any)['target'];
    if (oldTarget?.uid !== target.uid) {
      // 使用框架 API 设置以触发 onSubModelAdded 事件（菜单将自动重建）
      this.setSubModel('target', target);
      // 清理旧实例
      if (oldTarget) {
        this._scopedEngine?.removeModel(oldTarget.uid);
      }
    } else {
      (this.subModels as any)['target'] = target;
      (this as any).emitter?.emit?.('onSubModelReplaced', { oldModel: oldTarget, newModel: target });
    }

    this._targetModel = target;
    this._resolvedTargetUid = targetUid;
    // 将 collection 代理到目标区块，供筛选器等依赖读取
    this.context.defineProperty('collection', {
      get: () => (target as any)?.context?.collection,
      cache: false,
    });
    // 主动请求重渲染以刷新标题等
    this.rerender();
  }

  renderComponent() {
    const target: FlowModel | undefined = (this.subModels as any)?.['target'];
    if (!target) {
      const errorColor =
        (this.context as any)?.themeToken?.colorErrorText || (this.context as any)?.themeToken?.colorError || '#ff4d4f';
      return (
        <div style={{ padding: 16, color: errorColor }} role="alert" aria-live="polite">
          {this.translate?.('Target block missing or invalid') || 'Target block missing or invalid'}
        </div>
      );
    }
    return <FlowModelRenderer key={target.uid} model={target} showFlowSettings={false} showErrorFallback />;
  }

  /**
   * 覆盖 BlockModel.render，移除 Card 包裹，使外观与被嵌入区块保持一致。
   * 仍保留 ref 以兼容定位/设置入口等能力。
   */
  public render(): any {
    return <div ref={this.context.ref}>{this.renderComponent()}</div>;
  }
}

// 配置：仅提供目标 UID 的输入
EmbedBlockModel.registerFlow({
  key: 'embedSettings',
  sort: -999,
  title: escapeT('Embed settings'),
  steps: {
    target: {
      title: escapeT('Target model'),
      uiSchema: {
        targetUid: {
          title: escapeT('Target UID'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-validator': [
            {
              format: 'string',
            },
          ],
        },
      },
      handler(ctx, params) {
        const v = (params?.targetUid || '').trim();
        ctx.model.setStepParams('embedSettings', 'target', { targetUid: v });
      },
    },
  },
});

// 覆盖父类 BlockModel 的 cardSettings（移除卡片设置，保持与目标区块外观一致）
EmbedBlockModel.registerFlow({
  key: 'cardSettings',
  steps: {},
});

EmbedBlockModel.define({
  label: escapeT('Embed'),
  group: escapeT('Other blocks'),
  createModelOptions: {
    use: 'EmbedBlockModel',
  },
  sort: 900,
});
