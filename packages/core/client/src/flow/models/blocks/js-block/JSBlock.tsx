/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy } from '@nocobase/flow-engine';
import { Card } from 'antd';
import React from 'react';
import { BlockModel } from '../../base/BlockModel';

const NAMESPACE = 'client';

export class JSBlockModel extends BlockModel {
  render() {
    return (
      <Card id={`model-${this.uid}`} className="code-block">
        <div ref={this.context.ref} />
      </Card>
    );
  }
  protected onMount() {
    // if having ref, should rerender to insert content to html again
    if (this.context.ref.current) {
      this.rerender();
    }
  }
}

JSBlockModel.define({
  label: 'JS block',
});

JSBlockModel.registerFlow({
  key: 'jsSettings',
  title: 'JavaScript settings',
  steps: {
    runJs: {
      title: 'Write JavaScript',
      uiSchema: {
        code: {
          type: 'string',
          title: 'Write JavaScript',
          'x-component': 'CodeEditor',
          'x-component-props': {
            minHeight: '400px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          width: '70%',
        },
      },
      defaultParams(ctx) {
        return {
          version: '1.0.0',
          code:
            `// Welcome to the JavaScript block
// Create powerful interactive components with JavaScript
ctx.element.innerHTML = \`
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">
    <h2 style="color: #1890ff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      🚀 \${ctx.i18n.t('Welcome to JavaScript block', { ns: '` +
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
        const { code = '' } = params;
        // 创建安全的 window 和 document
        const safeWindow = new Proxy(
          {},
          {
            get(target, prop: string) {
              const allowedGlobals = {
                setTimeout,
                clearTimeout,
                setInterval,
                clearInterval,
                console,
                // fetch,
                Math,
                Date,
                // 其他需要的全局对象或方法
              };
              if (prop in allowedGlobals) {
                return allowedGlobals[prop];
              }
              throw new Error(`Access to global property "${prop}" is not allowed.`);
            },
          },
        );

        const safeDocument = new Proxy(
          {},
          {
            get(target, prop: string) {
              const allowedDocumentMethods = {
                createElement: document.createElement.bind(document),
                querySelector: document.querySelector.bind(document),
                querySelectorAll: document.querySelectorAll.bind(document),
                // 其他需要的 document 方法
              };
              if (prop in allowedDocumentMethods) {
                return allowedDocumentMethods[prop];
              }
              throw new Error(`Access to document property "${prop}" is not allowed.`);
            },
          },
        );

        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
          });

          // 使用安全的 window 和 document 执行代码
          await ctx.runjs(code, { window: safeWindow, document: safeDocument });
        });
      },
    },
  },
});
