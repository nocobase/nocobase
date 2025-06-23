/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, Spin } from 'antd';
import React, { createRef } from 'react';
import { BlockModel } from '@nocobase/client';
import { CodeEditor } from './CodeEditor';

function waitForRefCallback<T extends HTMLElement>(ref: React.RefObject<T>, cb: (el: T) => void, timeout = 3000) {
  const start = Date.now();
  function check() {
    if (ref.current) return cb(ref.current);
    if (Date.now() - start > timeout) return;
    setTimeout(check, 30);
  }
  check();
}

export class LowcodeBlockFlowModel extends BlockModel {
  ref = createRef<HTMLDivElement>();

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
      <Card>
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
            <div style={{ marginTop: '8px' }}>Loading lowcode component...</div>
          </div>
        )}
        <div ref={this.ref} style={{ width: '100%', minHeight: '200px' }} />
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
            placeholder: `// Welcome to the lowcode block
// Build interactive components with JavaScript and external libraries

// Available variables:
// - element: The DOM element to render into
// - ctx: Flow context with globals (ctx.globals.api for NocoBase API)
// - model: Current model instance
// - requirejs: Function to load external JavaScript libraries (callback style)
// - requireAsync: Function to load external JavaScript libraries (async/await style)
// - loadCSS: Function to load external CSS files

// Example: Basic HTML content
// Create beautiful, interactive components
element.innerHTML = \`
  <div style="padding: 20px; text-align: center; font-family: system-ui;">
    <h3 style="color: #1890ff;">🚀 Welcome to Lowcode Block</h3>
    <p>Start building your custom component here!</p>
  </div>
\`;

// Example: Load external library
// const echarts = await requireAsync('echarts');
// const chart = echarts.init(element);`,
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
      async handler(ctx: any, params: any) {
        ctx.model.setProps('loading', true);
        ctx.model.setProps('error', null);

        waitForRefCallback(ctx.model.ref, async (element: HTMLElement) => {
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

            // Create a safe execution context for the code (as async function)
            // Wrap user code in an async function
            const wrappedCode = `
              return (async function(element, ctx, model, requirejs, requireAsync, loadCSS) {
                ${params.code}
              }).apply(this, arguments);
            `;
            const executionFunction = new Function(wrappedCode);

            // Execute the code
            await executionFunction(element, ctx, ctx.model, requirejs, requireAsync, loadCSS);

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
