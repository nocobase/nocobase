/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, tExpr, createSafeDocument, createSafeWindow, createSafeNavigator } from '@nocobase/flow-engine';
import React from 'react';
import { BlockModel } from '../../base';
import { BlockItemCard } from '../../../components';
import { resolveRunJsParams } from '../../utils/resolveRunJsParams';
import { CodeEditor } from '../../../components/code-editor';

const NAMESPACE = 'client';

export class JSBlockModel extends BlockModel {
  // Avoid double-run on first mount; only rerun after remounts
  private _mountedOnce = false;
  renderComponent(): React.ReactNode {
    return <div ref={this.context.ref} />;
  }
  render() {
    const decoratorProps = this.decoratorProps || {};
    const { className, id: _ignoredId, title, description, ...rest } = decoratorProps;
    const mergedClassName = ['code-block', className].filter(Boolean).join(' ');

    return (
      <BlockItemCard
        id={`model-${this.uid}`}
        className={mergedClassName}
        title={title}
        description={description}
        {...rest}
      >
        <div ref={this.context.ref} />
      </BlockItemCard>
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
  label: tExpr('JS block'),
  createModelOptions: {
    use: 'JSBlockModel',
  },
});

JSBlockModel.registerFlow({
  key: 'jsSettings',
  title: 'JavaScript settings',
  steps: {
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
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
ctx.render(\`
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
\`);`.trim(),
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
            info: {
              deprecated: {
                replacedBy: 'ctx.render',
              },
            },
          });
          const navigator = createSafeNavigator();
          await ctx.runjs(
            code,
            { window: createSafeWindow({ navigator }), document: createSafeDocument(), navigator },
            { version },
          );
        });
      },
    },
  },
});
