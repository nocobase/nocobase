/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BlockModel } from '@nocobase/client';
import { APIResource } from '@nocobase/flow-engine';
import { Card, Skeleton, Spin } from 'antd';
import React, { createRef } from 'react';
import { CodeEditor } from './CodeEditor';

export class LowcodeBlockFlowModel extends BlockModel {
  ref = createRef<HTMLDivElement>();
  declare resource: APIResource;

  render() {
    const { loading, error } = this.props;

    if (error) {
      return (
        <Card>
          <div style={{ color: 'red', padding: '16px' }}>Error loading lowcode component: {error}</div>
        </Card>
      );
    }

    return (
      <Card id={`model-${this.uid}`} className="lowcode-block">
        <Spin spinning={loading} tip="Loading lowcode component...">
          <div ref={this.ref} style={{ width: '100%' }} />
        </Spin>
      </Card>
    );
  }
}

// Export CodeEditor for external use
export { CodeEditor };

LowcodeBlockFlowModel.define({
  title: 'Lowcode',
  group: 'Content',
  icon: 'CloudOutlined',
  defaultOptions: {
    use: 'LowcodeBlockFlowModel',
    stepParams: {
      default: {
        executionStep: {
          code: `
// Welcome to the lowcode block
// Create powerful interactive components with JavaScript
element.innerHTML = \`
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">
    <h2 style="color: #1890ff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      🚀 Welcome to Lowcode Block
    </h2>
    
    <p style="color: #666; margin-bottom: 24px; font-size: 16px;">
      Build interactive components with JavaScript and external libraries
    </p>
    
    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">✨ Key Features</h3>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;">🎨 <strong>Custom JavaScript execution</strong> - Full programming capabilities</li>
        <li style="margin-bottom: 8px;">📚 <strong>External library support</strong> - Load any npm package or CDN library</li>
        <li style="margin-bottom: 8px;">🔗 <strong>NocoBase API integration</strong> - Access your data and collections</li>
        <li style="margin-bottom: 8px;">💡 <strong>Async/await support</strong> - Handle asynchronous operations</li>
        <li style="margin-bottom: 8px;">🎯 <strong>Direct DOM manipulation</strong> - Full control over rendering</li>
      </ul>
    </div>
    
    <div style="background: #e6f7ff; border-left: 4px solid #1890ff; padding: 16px; border-radius: 4px;">
      <p style="margin: 0; color: #333; font-size: 14px;">
        💡 <strong>Ready to start?</strong> Replace this code with your custom JavaScript to build amazing components!
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

LowcodeBlockFlowModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    setMainResource: {
      handler(ctx) {
        if (ctx.model.resource) {
          return;
        }
        ctx.model.resource = new APIResource();
        ctx.model.resource.setAPIClient(ctx.globals.api);
      },
    },
    executionStep: {
      uiSchema: {
        code: {
          type: 'string',
          title: 'Execution Code',
          'x-component': 'CodeEditor',
          'x-component-props': {
            minHeight: '400px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      defaultParams: {
        code: `
// Welcome to the lowcode block
// Create powerful interactive components with JavaScript
element.innerHTML = \`
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">
    <h2 style="color: #1890ff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      🚀 Welcome to Lowcode Block
    </h2>
    
    <p style="color: #666; margin-bottom: 24px; font-size: 16px;">
      Build interactive components with JavaScript and external libraries
    </p>
    
    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">✨ Key Features</h3>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;">🎨 <strong>Custom JavaScript execution</strong> - Full programming capabilities</li>
        <li style="margin-bottom: 8px;">📚 <strong>External library support</strong> - Load any npm package or CDN library</li>
        <li style="margin-bottom: 8px;">🔗 <strong>NocoBase API integration</strong> - Access your data and collections</li>
        <li style="margin-bottom: 8px;">💡 <strong>Async/await support</strong> - Handle asynchronous operations</li>
        <li style="margin-bottom: 8px;">🎯 <strong>Direct DOM manipulation</strong> - Full control over rendering</li>
      </ul>
    </div>
    
    <div style="background: #e6f7ff; border-left: 4px solid #1890ff; padding: 16px; border-radius: 4px;">
      <p style="margin: 0; color: #333; font-size: 14px;">
        💡 <strong>Ready to start?</strong> Replace this code with your custom JavaScript to build amazing components!
      </p>
    </div>
  </div>
\`;
        `.trim(),
      },
      settingMode: 'drawer',
      title: 'Code',
      async handler(ctx, params: any) {
        ctx.model.setProps('loading', true);
        ctx.model.setProps('error', null);
        ctx.reactView.onRefReady(ctx.model.ref, async (element: HTMLElement) => {
          try {
            // Get requirejs from app context
            const requirejs = ctx.app?.requirejs?.requirejs;

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
              return ctx.globals.flowEngine.getModel(uid);
            };

            const request = ctx.globals.api.request.bind(ctx.globals.api);

            // Create a safe execution context for the code (as async function)
            // Wrap user code in an async function
            const wrappedCode = `
              return (async function(element, ctx, model, resource, requirejs, requireAsync, loadCSS, getModelById, request) {
                ${params.code}
              }).apply(this, arguments);
            `;
            const executionFunction = new Function(wrappedCode);

            // Execute the code
            await executionFunction(
              element,
              ctx,
              ctx.model,
              ctx.model.resource,
              requirejs,
              requireAsync,
              loadCSS,
              getModelById,
              request,
            );

            ctx.model.setProps('loading', false);
          } catch (error: any) {
            console.error('Lowcode component execution error:', error);
            ctx.model.setProps('error', error.message);
            ctx.model.setProps('loading', false);
          }
        });
      },
    },
  },
});
