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

export class CloudBlockFlowModel extends BlockModel {
  ref = createRef<HTMLDivElement>();

  render() {
    const { loading, error } = this.props;

    if (error) {
      return (
        <Card>
          <div style={{ color: 'red', padding: '16px' }}>Error loading cloud component: {error}</div>
        </Card>
      );
    }

    return (
      <Card>
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
            <div style={{ marginTop: '8px' }}>Loading cloud component...</div>
          </div>
        )}
        <div ref={this.ref} style={{ width: '100%', minHeight: '200px' }} />
      </Card>
    );
  }
}

// Export CodeEditor for external use
export { CodeEditor };

CloudBlockFlowModel.define({
  title: 'Cloud Component',
  group: 'Content',
  icon: 'CloudOutlined',
  defaultOptions: {
    use: 'CloudBlockFlowModel',
    stepParams: {
      default: {
        executionStep: {
          code: `
// Example execution code
element.innerHTML = '<h3>Cloud Component Demo</h3><p>This is a simplified cloud component.</p>';
          `.trim(),
        },
      },
    },
  },
});

CloudBlockFlowModel.registerFlow({
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
            height: '400px',
            theme: 'light',
            placeholder: `// Write your execution code here
// Available variables:
// - element: The DOM element to render into
// - ctx: Flow context
// - model: Current model instance
// - requirejs: Function to load external JavaScript libraries (callback style)
// - requireAsync: Function to load external JavaScript libraries (async/await style)
// - loadCSS: Function to load external CSS files

element.innerHTML = '<h3>Hello World</h3><p>This is a cloud component.</p>';`,
          },
        },
      },
      defaultParams: {
        code: `
// Example execution code
element.innerHTML = '<h3>Cloud Component Demo</h3><p>This is a simplified cloud component.</p>';

// You can also use async/await
// await new Promise(resolve => setTimeout(resolve, 1000));
// element.innerHTML += '<br>Async operation completed!';
        `.trim(),
      },
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
            console.error('Cloud component execution error:', error);
            ctx.model.setProps('error', error.message);
            ctx.model.setProps('loading', false);
          }
        });
      },
    },
  },
});
