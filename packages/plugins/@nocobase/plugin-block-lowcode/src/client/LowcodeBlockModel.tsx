/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { APIClient, BlockModel } from '@nocobase/client';
import {
  APIResource,
  BaseRecordResource,
  FlowEngine,
  MultiRecordResource,
  SingleRecordResource,
} from '@nocobase/flow-engine';
import * as antd from 'antd';
import { Card, Spin } from 'antd';
import React, { createRef } from 'react';
import ReactDOM from 'react-dom/client';
import { NAMESPACE, tStr } from './locale';
export class LowcodeBlockModel extends BlockModel {
  ref = createRef<HTMLDivElement>();
  declare resource: APIResource;

  render() {
    const { loading, error } = this.props;

    if (error) {
      return (
        <Card>
          <div style={{ color: 'red', padding: '16px' }}>Error loading code component: {error}</div>
        </Card>
      );
    }

    return (
      <Card id={`model-${this.uid}`} className="code-block">
        <Spin spinning={loading} tip="Loading code component...">
          <div ref={this.ref} style={{ width: '100%' }} />
        </Spin>
      </Card>
    );
  }
}

LowcodeBlockModel.define({
  title: 'Code',
  group: 'Content',
  icon: 'CloudOutlined',
  defaultOptions: {
    use: 'LowcodeBlockModel',
    stepParams: {
      default: {
        executionStep: {
          code:
            `
// Welcome to the lowcode block
// Create powerful interactive components with JavaScript
ctx.element.innerHTML = \`
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">
    <h2 style="color: #1890ff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      🚀 \${ctx.i18n.t('Welcome to code block', { ns: '` +
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
\`;
          `.trim(),
        },
      },
    },
  },
});

LowcodeBlockModel.registerFlow({
  key: 'default',
  title: tStr('Configuration'),
  auto: true,
  steps: {
    executionStep: {
      title: tStr('Code'),
      uiSchema: {
        code: {
          type: 'string',
          title: tStr('Execution Code'),
          'x-component': 'CodeEditor',
          'x-component-props': {
            minHeight: '400px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      defaultParams: {
        code:
          `
// Welcome to the code block
// Create powerful interactive components with JavaScript
ctx.element.innerHTML = \`
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">
    <h2 style="color: #1890ff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      🚀 \${ctx.i18n.t('Welcome to code block', { ns: '` +
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
\`;
        `.trim(),
      },
      settingMode: 'drawer',
      async handler(flowContext, params: any) {
        // Check if URL ends with skip_nocobase_lowcode=true and return early if so
        // Giving a way to avoid some bad js code (or breaking changes in future versions) break the page and can't recover from ui
        if (window.location.href.endsWith('skip_nocobase_lowcode=true')) {
          return;
        }

        flowContext.model.setProps('loading', true);
        flowContext.model.setProps('error', null);
        flowContext.reactView.onRefReady(flowContext.model.ref, async (element: HTMLElement) => {
          try {
            // Get requirejs from app context
            const requirejs = flowContext.app?.requirejs?.requirejs;

            // Helper function to load CSS
            const loadCSS = (url: string): Promise<void> => {
              return new Promise((resolve, reject) => {
                // Check if CSS is already loaded
                const existingLink = document.querySelector(`link[href="${url}"]`);
                if (existingLink) {
                  resolve();
                  return;
                }

                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;
                link.onload = () => resolve();
                link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
                document.head.appendChild(link);
              });
            };

            // Helper function for async requirejs
            const requireAsync = (modules: string | string[]): Promise<any> => {
              return new Promise((resolve, reject) => {
                if (!requirejs) {
                  reject(new Error('requirejs is not available'));
                  return;
                }

                const moduleList = Array.isArray(modules) ? modules : [modules];
                requirejs(
                  moduleList,
                  (...args: any[]) => {
                    // If single module, return the module directly
                    // If multiple modules, return array
                    resolve(moduleList.length === 1 ? args[0] : args);
                  },
                  reject,
                );
              });
            };

            const getModelById = (uid: string) => {
              return flowContext.flowEngine.getModel(uid);
            };

            const flowEngine = flowContext.flowEngine as FlowEngine;

            const request = flowContext.api.request.bind(flowContext.api);
            const api = flowContext.app.apiClient as APIClient;

            // Create a safe execution context for the code (as async function)
            // Wrap user code in an async function
            const wrappedCode = `
              return (async function(ctx) {
                ${params.code}
              }).apply(this, arguments);
            `;
            const executionFunction = new Function(wrappedCode);
            const lowcodeContext = {
              Components: { antd },
              Resources: { APIResource, BaseRecordResource, SingleRecordResource, MultiRecordResource },
              React,
              ReactDOM,
              flowEngine,
              element,
              model: flowContext.model,
              router: flowContext.app.router.router,
              i18n: flowContext.app.i18n,
              request,
              requirejs,
              requireAsync,
              loadCSS,
              getModelById,
              initResource(use: typeof APIResource, options?: any) {
                if (flowContext.model.resource) {
                  return flowContext.model.resource;
                }
                const resource = new use() as APIResource;
                resource.setAPIClient(flowContext.api);
                if (options && typeof options === 'object') {
                  Object.entries(options).forEach(([key, value]) => {
                    resource.setRequestOptions(key, value);
                  });
                }
                flowContext.model.resource = resource;
                return resource;
              },
              flowContext,
              auth: {
                role: api.auth.role,
                locale: api.auth.locale,
                token: api.auth.token,
                user: flowContext.user,
              },
            };
            // Execute the code
            await executionFunction(lowcodeContext);

            flowContext.model.setProps('loading', false);
          } catch (error: any) {
            console.error('Code component execution error:', error);
            flowContext.model.setProps('error', error.message);
            flowContext.model.setProps('loading', false);
          }
        });
      },
    },
  },
});
