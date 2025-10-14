/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer } from '@formily/reactive-react';
import { observe } from '@formily/reactive';
import { escapeT, FlowModelRenderer, FlowModel, FlowEngineProvider } from '@nocobase/flow-engine';
import { BlockModel } from '../../base';

/**
 * EmbedBlockModel
 *
 * 透明嵌入容器：自身不渲染卡片/边框，只渲染目标区块（同层 view 内的现有区块）的内容。
 * - 同步：与原始区块共享 stepParams、标题、布局；
 * - 分离：镜像使用独立 resource（不与原区块共享 filter 缓存）。
 */
export class EmbedBlockModel extends BlockModel {
  private _mirrorEngine: any | null = null;
  private _mirrorModel: FlowModel | null = null;
  private _mirrorFromUid?: string;
  private _disposers: Array<() => void> = [];

  /** 读取配置 */
  private get settings() {
    const params = (this.getStepParams('embedSettings', 'init') as any) || {};
    return params as { targetUid?: string };
  }

  /**
   * 构建/复用镜像：在隔离引擎中用 serialize 重建整树，并桥接上下文。
   */
  private async ensureMirrorFor(master: FlowModel): Promise<FlowModel | null> {
    try {
      const targetUid = this.settings?.targetUid;
      const needRecreate = !this._mirrorModel || this._mirrorFromUid !== targetUid;
      console.info('[EMBED-DBG] ensureMirrorFor start', { embedUid: this.uid, targetUid, needRecreate });
      if (needRecreate) {
        // 清理旧镜像
        this._disposers.forEach((fn) => {
          try {
            fn();
          } catch (_) {
            /* noop */
          }
        });
        this._disposers = [];
        try {
          delete (this.subModels as any).__embedded;
        } catch (_) {
          /* noop */
        }
        this._mirrorModel = null;
        this._mirrorEngine = null;

        // 1) 创建“区块级”隔离引擎（实例/缓存隔离）
        const subEngine = await (this.flowEngine.context as any).createIsolatedEngine('block');
        if (!subEngine) return null;
        this._mirrorEngine = subEngine;

        // 2) 使用 master.serialize() 在子引擎中重建整个树（一步到位）
        const serialized = master.serialize();
        const mirror = subEngine.createModel(serialized as any) as FlowModel;
        this._mirrorModel = mirror;
        this._mirrorFromUid = targetUid;
        // 把镜像作为虚拟子模型挂入（仅菜单用途，序列化时会剔除）；用 API 触发事件，促使菜单刷新
        try {
          this.setSubModel('__embedded' as any, mirror as any);
        } catch (_) {
          (this.subModels as any).__embedded = mirror;
        }
        // 提升当前模型的菜单层级（通过 props 传递给渲染器）
        try {
          this.setProps('settingsMenuLevel', 4);
        } catch (_) {
          (this as any).settingsMenuLevel = 4;
        }
        try {
          this.parent?.rerender?.();
        } catch (_) {
          /* noop */
        }
        console.info('[EMBED-DBG] mirror created & attached', {
          embedUid: this.uid,
          mirrorUid: (mirror as any)?.uid,
          menuLevel: (this as any).settingsMenuLevel,
          subModelKeys: Object.keys(this.subModels || {}),
        });
        try {
          this.setProps('__mirrorTick', Date.now());
        } catch (_) {
          /* noop */
        }

        // 提供一个可复用的整树重建函数（用于结构/参数不同步时的兜底）
        const rebuildAll = () => {
          try {
            const next = master.serialize();
            const m = this._mirrorEngine?.createModel(next as any) as FlowModel;
            this._mirrorModel = m;
            try {
              this.setSubModel('__embedded' as any, m as any);
            } catch (_) {
              (this.subModels as any).__embedded = m;
            }
            try {
              this.setProps('__mirrorTick', Date.now());
              m?.rerender?.();
            } catch (_) {
              /* noop */
            }
          } catch (e) {
            console.warn('[EMBED-DBG] rebuildAll failed', e);
          }
        };

        // 将 view/collection 代理到镜像，保证 openView 的路由与字段读取
        try {
          this.context.defineProperty('collection', {
            get: () => this._mirrorModel?.context?.collection,
            cache: false,
          });
          mirror.context?.defineProperty?.('view', { get: () => this.context.view, cache: false });
          console.info('[EMBED-DBG] context bridged', { embedUid: this.uid, mirrorUid: (mirror as any)?.uid });
        } catch (_) {
          /* noop */
        }

        // 重定向镜像树的 openFlowSettings 到 master（基于 uid 映射），保证“在 embed 打开的设置”真实作用于 master
        try {
          const redirectOpen = (node: FlowModel) => {
            const self = node as any;
            const orig = self.openFlowSettings?.bind(self);
            self.openFlowSettings = async (options?: any) => {
              try {
                const target = (master.flowEngine.getModel(self.uid) as FlowModel) || master;
                return await target.openFlowSettings(options);
              } catch (e) {
                // 若映射失败，退回镜像自身（避免阻断）
                return await orig?.(options);
              }
            };
            // 递归子模型
            const subs = node.subModels || ({} as any);
            for (const [k, v] of Object.entries(subs)) {
              if (Array.isArray(v)) {
                v.forEach((sm) => sm instanceof FlowModel && redirectOpen(sm));
              } else if (v instanceof FlowModel) {
                redirectOpen(v as any);
              }
            }
          };
          redirectOpen(mirror);
          console.info('[EMBED-DBG] redirect openFlowSettings installed', { embedUid: this.uid });
        } catch (_) {
          /* noop */
        }

        // 同步 stepParams：
        // 1) 监听 master 自身 stepParams 变化
        // 2) 递归监听所有子模型的 stepParams 变化，并将对应 uid 的镜像模型 stepParams 与之对齐
        try {
          const attachStepParamsObservers = (node: FlowModel) => {
            try {
              const stop = observe(node.stepParams, () => {
                try {
                  const mm = this._mirrorEngine?.getModel(node.uid) as FlowModel | undefined;
                  if (mm) {
                    mm.setStepParams(node.getStepParams());
                    mm.rerender?.();
                  } else {
                    // 找不到镜像对应节点，整树重建兜底
                    const next = master.serialize();
                    const m = this._mirrorEngine?.createModel(next as any) as FlowModel;
                    this._mirrorModel = m;
                    try {
                      this.setSubModel('__embedded' as any, m as any);
                    } catch (_) {
                      (this.subModels as any).__embedded = m;
                    }
                    this.setProps('__mirrorTick', Date.now());
                  }
                } catch (_) {
                  /* noop */
                }
              });
              this._disposers.push(stop);
            } catch (_) {
              /* noop */
            }
            // 递归子模型
            const subs = node.subModels || ({} as any);
            for (const [k, v] of Object.entries(subs)) {
              if (Array.isArray(v)) v.forEach((sm) => sm instanceof FlowModel && attachStepParamsObservers(sm));
              else if (v instanceof FlowModel) attachStepParamsObservers(v as any);
            }
          };
          // 安装观察
          attachStepParamsObservers(master);
          console.info('[EMBED-DBG] observe stepParams installed (deep)', { embedUid: this.uid });
        } catch (_) {
          /* noop */
        }

        // 同步子模型移动/替换
        try {
          const onMoved = ({ source, target }: any) => {
            try {
              if (!source?.uid || !target?.uid) return;
              subEngine.moveModel(source.uid, target.uid, { persist: false });
              try {
                this.setProps('__mirrorTick', Date.now());
                this._mirrorModel?.rerender?.();
              } catch (_) {
                /* noop */
              }
            } catch (_) {
              /* noop */
            }
          };
          const onReplaced = ({ oldModel, newModel }: any) => {
            try {
              if (!oldModel?.uid || !newModel) return;
              subEngine.removeModel(oldModel.uid);
              const ser = typeof newModel.serialize === 'function' ? newModel.serialize() : null;
              if (ser) subEngine.createModel(ser as any);
              try {
                this.setProps('__mirrorTick', Date.now());
                this._mirrorModel?.rerender?.();
              } catch (_) {
                /* noop */
              }
            } catch (_) {
              /* noop */
            }
          };
          master.emitter.on('onSubModelMoved', onMoved);
          master.emitter.on('onSubModelReplaced', onReplaced);
          master.emitter.on('onSubModelAdded', rebuildAll);
          master.emitter.on('onSubModelRemoved', rebuildAll);
          this._disposers.push(() => master.emitter.off('onSubModelMoved', onMoved));
          this._disposers.push(() => master.emitter.off('onSubModelReplaced', onReplaced));
          this._disposers.push(() => master.emitter.off('onSubModelAdded', rebuildAll));
          this._disposers.push(() => master.emitter.off('onSubModelRemoved', rebuildAll));
          console.info('[EMBED-DBG] mirror sync handlers attached', { embedUid: this.uid });
        } catch (_) {
          /* noop */
        }

        // 深度结构监听：对子树所有节点安装 onSubModelAdded/Removed/Replaced/Moved 监听，确保“在任意层级新增/删除/替换”都能触发同步
        try {
          const attachStructureObservers = (node: FlowModel) => {
            if (!node?.emitter) return;
            const add = () => rebuildAll();
            const rm = () => rebuildAll();
            const mv = () => rebuildAll();
            const rp = () => rebuildAll();
            node.emitter.on('onSubModelAdded', add);
            node.emitter.on('onSubModelRemoved', rm);
            node.emitter.on('onSubModelMoved', mv);
            node.emitter.on('onSubModelReplaced', rp);
            this._disposers.push(() => node.emitter.off('onSubModelAdded', add));
            this._disposers.push(() => node.emitter.off('onSubModelRemoved', rm));
            this._disposers.push(() => node.emitter.off('onSubModelMoved', mv));
            this._disposers.push(() => node.emitter.off('onSubModelReplaced', rp));
            const subs = node.subModels || ({} as any);
            for (const [k, v] of Object.entries(subs)) {
              if (Array.isArray(v)) v.forEach((sm) => sm instanceof FlowModel && attachStructureObservers(sm));
              else if (v instanceof FlowModel) attachStructureObservers(v as any);
            }
          };
          attachStructureObservers(master);
          console.info('[EMBED-DBG] deep structure observers attached', { embedUid: this.uid });
        } catch (_) {
          /* noop */
        }

        // 独立 resource（复制 master 基础配置），避免筛选污染原区块
        try {
          const init =
            (typeof (master as any).getResourceSettingsInitParams === 'function'
              ? (master as any).getResourceSettingsInitParams()
              : master.getStepParams?.('resourceSettings', 'init')) || {};
          const masterRes = (master as any).resource || master.context?.resource;
          const resType = masterRes?.constructor?.name as string | undefined;
          if (resType && typeof subEngine.createResource === 'function') {
            const mirrorRes = subEngine.createResource(resType as any, { context: mirror.context });
            if (init?.dataSourceKey && mirrorRes?.setDataSourceKey) mirrorRes.setDataSourceKey(init.dataSourceKey);
            const resName = init?.associationName || init?.collectionName;
            if (resName && mirrorRes?.setResourceName) mirrorRes.setResourceName(resName);
            if (init?.filterByTk !== undefined && mirrorRes?.setFilterByTk) mirrorRes.setFilterByTk(init.filterByTk);
            if (init?.sourceId !== undefined && mirrorRes?.setSourceId) mirrorRes.setSourceId(init.sourceId);
            try {
              mirrorRes.on?.('refresh', () => {
                try {
                  mirror.invalidateFlowCache?.('beforeRender');
                } catch (_) {
                  /* noop */
                }
              });
            } catch (_) {
              /* noop */
            }
            mirror.context?.defineProperty?.('resource', { value: mirrorRes });
            mirror.context?.defineProperty?.('resourceName', {
              get: () => mirrorRes?.getResourceName?.(),
              cache: false,
            });
            mirror.context?.defineProperty?.('filterManager', {
              value: {
                getFilterConfigs: () => [],
                bindToTarget: (_: string) => {
                  /* noop */
                },
                unbindFromTarget: (_: string) => {
                  /* noop */
                },
                refreshTargetsByFilter: async (_: any) => {
                  /* noop */
                },
              },
            });
            // 同步 master resource 的 appends/fields，确保关联字段/选择字段能显示
            try {
              const appends = typeof masterRes?.getAppends === 'function' ? masterRes.getAppends() : [];
              if (Array.isArray(appends) && appends.length && typeof mirrorRes?.setAppends === 'function') {
                mirrorRes.setAppends(appends);
              }
            } catch (_) {
              /* noop */
            }
            try {
              const fields = typeof masterRes?.getFields === 'function' ? masterRes.getFields() : [];
              if (Array.isArray(fields) && fields.length && typeof mirrorRes?.setFields === 'function') {
                mirrorRes.setFields(fields);
              }
            } catch (_) {
              /* noop */
            }
            console.info('[EMBED-DBG] mirror resource ready', {
              embedUid: this.uid,
              ds: init?.dataSourceKey,
              col: resName,
            });
          }
        } catch (_) {
          /* noop */
        }
      }

      return this._mirrorModel;
    } catch (e) {
      console.warn('EmbedBlockModel.ensureMirrorFor failed:', e);
      return null;
    }
  }

  /**
   * 根据 uid 查找/加载目标模型并构建镜像：
   * - 先全局查找当前视图栈是否已有；
   * - 若没有，直接通过当前引擎从仓库加载（支持“跨 view”）；
   */
  private async ensureMirrorForUid(targetUid: string): Promise<FlowModel | null> {
    try {
      let master = this.flowEngine.getModel(targetUid, true) as FlowModel | undefined;
      if (!master) {
        master = (await this.flowEngine.loadModel({ uid: targetUid })) as FlowModel | undefined;
      }
      if (!master) return null;
      return await this.ensureMirrorFor(master);
    } catch (e) {
      console.warn('[EMBED-DBG] ensureMirrorForUid failed', e);
      return null;
    }
  }

  render() {
    const { targetUid } = this.settings || {};
    // 订阅 tick，使 setProps('__mirrorTick', ...) 触发响应式重渲
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.props && (this.props as any).__mirrorTick;
    if (!targetUid) {
      if (this.flowEngine?.flowSettings?.enabled) {
        return <div style={{ padding: 8, color: '#999' }}>{this.translate('Please set targetUid')}</div>;
      }
      return null;
    }

    if (!this._mirrorModel || this._mirrorFromUid !== targetUid) {
      this.ensureMirrorForUid(targetUid)
        .then(() => {
          try {
            this.rerender();
          } catch (_) {
            /* noop */
          }
        })
        .catch(() => {
          /* noop */
        });
      console.info('[EMBED-DBG] render placeholder', { embedUid: this.uid, targetUid });
      return this.flowEngine?.flowSettings?.enabled ? (
        <div style={{ padding: 8, color: '#999' }}>{this.translate('Preparing...')}</div>
      ) : null;
    }

    return (
      <FlowEngineProvider engine={this._mirrorEngine}>
        <FlowModelRenderer model={this._mirrorModel as any} showFlowSettings={false} />
      </FlowEngineProvider>
    );
  }

  get title() {
    try {
      const base = (this._mirrorModel as any)?.title || super.title;
      const suffix = ` ${this.translate('(embed)')}`; // i18n：括号与文案均可由语言包覆盖
      return typeof base === 'string' && base.endsWith(suffix) ? base : `${base}${suffix}`;
    } catch (_) {
      return `${super.title} ${this.translate('(embed)')}`;
    }
  }

  // 让 Embed 被“数据筛选器”等识别为数据区块：代理 resource、getFilterFields
  get resource(): any {
    try {
      return (this._mirrorModel as any)?.context?.resource || (this._mirrorModel as any)?.resource;
    } catch (_) {
      /* noop */
    }
    return undefined;
  }
  async getFilterFields(): Promise<any[]> {
    try {
      if (typeof (this._mirrorModel as any)?.getFilterFields === 'function')
        return await (this._mirrorModel as any).getFilterFields();
    } catch (_) {
      /* noop */
    }
    return [];
  }

  serialize(): Record<string, any> {
    const data = super.serialize();
    try {
      if (data?.subModels && (data.subModels as any).__embedded) delete (data.subModels as any).__embedded;
    } catch (_) {
      /* noop */
    }
    return data;
  }
}

EmbedBlockModel.define({ label: escapeT('Embed block') });

EmbedBlockModel.registerFlow({
  key: 'embedSettings',
  title: escapeT('Target'),
  steps: {
    init: {
      title: escapeT('Target'),
      uiSchema: {
        targetUid: {
          type: 'string',
          title: escapeT('Target model UID'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
      },
      defaultParams() {
        return { targetUid: '' } as any;
      },
      handler(ctx, params) {
        ctx.model.setStepParams('embedSettings', 'init', params || {});
      },
    },
  },
});
