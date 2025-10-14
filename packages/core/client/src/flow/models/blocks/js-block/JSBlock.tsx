/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, escapeT, createSafeDocument, createSafeWindow } from '@nocobase/flow-engine';
import { uid as genUid } from 'uid/secure';
import { Card } from 'antd';
import React from 'react';
import { BlockModel } from '../../base';
import { resolveRunJsParams } from '../../utils/resolveRunJsParams';
import { CodeEditor } from '../../../components/code-editor';

const NAMESPACE = 'client';

export class JSBlockModel extends BlockModel {
  // Avoid double-run on first mount; only rerun after remounts
  private _mountedOnce = false;
  render() {
    return (
      <Card id={`model-${this.uid}`} className="code-block">
        <div ref={this.context.ref} />
      </Card>
    );
  }
  protected onMount() {
    // Rerun only when remounting (e.g., after being hidden/unmounted)
    if (this._mountedOnce) {
      if (this.context.ref.current) {
        this.rerender();
      }
    }
    this._mountedOnce = true;
  }
}

JSBlockModel.define({
  label: escapeT('JS block'),
  createModelOptions: {
    use: 'JSBlockModel',
  },
});

JSBlockModel.registerFlow({
  key: 'jsSettings',
  title: 'JavaScript settings',
  steps: {
    runJs: {
      title: escapeT('Write JavaScript'),
      uiSchema: {
        code: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
            wrapperStyle: {
              position: 'fixed',
              inset: 8,
            },
          },
        },
      },
      uiMode: {
        type: 'embed',
        props: {
          styles: {
            body: {
              transform: 'translateX(0)',
            },
          },
        },
      },
      defaultParams(ctx) {
        return {
          version: 'v1',
          code:
            `// Welcome to the JS block
// Create powerful interactive components with JavaScript
ctx.element.innerHTML = \`
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">
    <h2 style="color: #1890ff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      🚀 \${ctx.i18n.t('Welcome to JS block', { ns: '` +
            NAMESPACE +
            `' })}
    </h2>

    <p style="color: #666; margin-bottom: 24px; font-size: 16px;">
      \${ctx.i18n.t('Build interactive components with JavaScript and external libraries', { ns: '` +
            NAMESPACE +
            `' })}
    </p>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">✨ \${ctx.i18n.t('Key Features', { ns: '` +
            NAMESPACE +
            `' })}</h3>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;">🎨 <strong>\${ctx.i18n.t('Custom JavaScript execution', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Full programming capabilities', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">📚 <strong>\${ctx.i18n.t('External library support', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Load any npm package or CDN library', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">🔗 <strong>\${ctx.i18n.t('NocoBase API integration', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Access your data and collections', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">💡 <strong>\${ctx.i18n.t('Async/await support', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Handle asynchronous operations', { ns: '` +
            NAMESPACE +
            `' })}</li>
        <li style="margin-bottom: 8px;">🎯 <strong>\${ctx.i18n.t('Direct DOM manipulation', { ns: '` +
            NAMESPACE +
            `' })}</strong> - \${ctx.i18n.t('Full control over rendering', { ns: '` +
            NAMESPACE +
            `' })}</li>
      </ul>
    </div>

    <div style="background: #e6f7ff; border-left: 4px solid #1890ff; padding: 16px; border-radius: 4px;">
      <p style="margin: 0; color: #333; font-size: 14px;">
        💡 <strong>\${ctx.i18n.t('Ready to start?', { ns: '` +
            NAMESPACE +
            `' })}</strong> \${ctx.i18n.t('Replace this code with your custom JavaScript to build amazing components!', { ns: '` +
            NAMESPACE +
            `' })}
      </p>
    </div>
  </div>
\`;`.trim(),
        };
      },
      handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        // 提供在 runjs 中一键替换为 EmbedBlockModel 的能力
        const _embedImpl = async (targetUid: string) => {
          try {
            const uid = (targetUid || '').trim();
            if (!uid) return;
            const engine = ctx.engine;
            // 使用 replaceModel 原位替换为 EmbedBlockModel，并写入目标 uid
            await engine.replaceModel(ctx.model.uid, {
              use: 'EmbedBlockModel',
              stepParams: {
                embedSettings: {
                  target: { targetUid: uid },
                },
              },
            });
            // 结束后续流程：embedBlock 执行后不再继续后面的脚本
            ctx.exitAll();
          } catch (error) {
            console.error('[JSBlockModel] embedBlock error:', error);
          }
        };
        // 仅保留新名称：embedBlock
        ctx.defineMethod('embedBlock', _embedImpl);
        // 提供复制现有模型树并原位替换当前 JSBlock 的能力
        const _copyImpl = async (sourceUid: string) => {
          try {
            const uid = (sourceUid || '').trim();
            if (!uid) return;
            const engine = ctx.engine;
            const sourceModel = engine.getModel(uid) || (await engine.loadModel({ uid }));
            if (!sourceModel) {
              console.warn('[JSBlockModel.copyModel] source model not found:', uid);
              return;
            }

            // 1) 获取完整序列化 JSON（包含子模型）
            const json = sourceModel.serialize();

            // 2) 收集所有 uid（递归遍历）
            const set = new Set<string>();
            const collect = (node: any) => {
              if (!node || typeof node !== 'object') return;
              if (typeof node.uid === 'string') set.add(node.uid);
              const sms = node.subModels;
              if (sms && typeof sms === 'object') {
                for (const key of Object.keys(sms)) {
                  const val = (sms as any)[key];
                  if (Array.isArray(val)) {
                    val.forEach((child) => collect(child));
                  } else if (val && typeof val === 'object') {
                    collect(val);
                  }
                }
              }
            };
            collect(json);

            // 3) 为每个 uid 生成新的 uid 映射
            const map = new Map<string, string>();
            const rootOldUid = json.uid as string;
            // 根节点 uid 固定映射为当前 JSBlock 的 uid，保持网格/父级引用稳定
            map.set(rootOldUid, ctx.model.uid);
            set.forEach((oldId) => {
              if (oldId === rootOldUid) return;
              map.set(oldId, genUid());
            });

            // 4) 字符串替换所有出现的旧 uid → 新 uid
            let str = JSON.stringify(json);
            for (const [oldId, newId] of map.entries()) {
              // 安全全局替换
              const re = new RegExp(oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
              str = str.replace(re, newId);
            }
            const newJson = JSON.parse(str);

            // 5) 用新 JSON 原位替换当前 JSBlock 模型
            await engine.replaceModel(ctx.model.uid, newJson);
            // 结束后续流程：copyBlock 执行后不再继续后面的脚本
            ctx.exitAll();
          } catch (error) {
            console.error('[JSBlockModel] copyBlock error:', error);
          }
        };
        // 仅保留新名称：copyBlock
        ctx.defineMethod('copyBlock', _copyImpl);
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
          });
          await ctx.runjs(code, { window: createSafeWindow(), document: createSafeDocument() }, { version });
        });
      },
    },
  },
});
