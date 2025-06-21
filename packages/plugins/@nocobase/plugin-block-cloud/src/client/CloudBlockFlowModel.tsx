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
import { BlockFlowModel } from '@nocobase/client';

function waitForRefCallback<T extends HTMLElement>(ref: React.RefObject<T>, cb: (el: T) => void, timeout = 3000) {
  const start = Date.now();
  function check() {
    if (ref.current) return cb(ref.current);
    if (Date.now() - start > timeout) return;
    setTimeout(check, 30);
  }
  check();
}

export class CloudBlockFlowModel extends BlockFlowModel {
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

CloudBlockFlowModel.define({
  title: 'Cloud Component',
  group: 'Content',
  icon: 'CloudOutlined',
  defaultOptions: {
    use: 'CloudBlockFlowModel',
    stepParams: {
      default: {
        loadLibrary: {
          jsUrl: 'https://cdn.jsdelivr.net/npm/echarts@5.4.2/dist/echarts.min.js',
          cssUrl: '',
          libraryName: 'echarts',
        },
        setupComponent: {
          adapterCode: `
// Example adapter code for ECharts
const chart = echarts.init(element);
const option = {
  title: { text: 'Cloud Component Demo' },
  tooltip: {},
  xAxis: { data: ['A', 'B', 'C', 'D', 'E'] },
  yAxis: {},
  series: [{
    name: 'Demo',
    type: 'bar',
    data: [5, 20, 36, 10, 10]
  }]
};
chart.setOption(option);
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
    loadLibrary: {
      uiSchema: {
        jsUrl: {
          type: 'string',
          title: 'JS CDN URL',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'https://cdn.jsdelivr.net/npm/library@version/dist/library.min.js',
          },
        },
        cssUrl: {
          type: 'string',
          title: 'CSS URL (Optional)',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'https://cdn.jsdelivr.net/npm/library@version/dist/library.min.css',
          },
        },
        libraryName: {
          type: 'string',
          title: 'Library Name',
          'x-component': 'Input',
          'x-component-props': {
            placeholder: 'echarts',
          },
        },
      },
      defaultParams: {
        jsUrl: 'https://cdn.jsdelivr.net/npm/echarts@5.4.2/dist/echarts.min.js',
        cssUrl: '',
        libraryName: 'echarts',
      },
      async handler(ctx: any, params: any) {
        ctx.model.setProps('loading', true);
        ctx.model.setProps('error', null);

        try {
          // Configure requirejs paths
          const paths: Record<string, string> = {};
          paths[params.libraryName] = params.jsUrl.replace(/\.js$/, '');

          // Load CSS if provided
          if (params.cssUrl) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = params.cssUrl;
            document.head.appendChild(link);
          }

          // Configure requirejs
          // const requireAsync = async (mod: string): Promise<any> => {
          //   return new Promise((resolve, reject) => {
          //     ctx.app.requirejs.requirejs([mod], (arg: any) => resolve(arg), reject);
          //   });
          // };

          ctx.app.requirejs.requirejs.config({ paths });
          await ctx.globals.requireAsync(params.libraryName);

          // Return the library name for the next step
          return { libraryName: params.libraryName };
        } catch (error: any) {
          ctx.model.setProps('error', error.message);
          ctx.model.setProps('loading', false);
          throw error;
        }
      },
    },
    setupComponent: {
      uiSchema: {
        adapterCode: {
          type: 'string',
          title: 'Adapter Code',
          'x-component': 'Input.TextArea',
          'x-component-props': {
            autoSize: { minRows: 10, maxRows: 20 },
            placeholder: `// Write your adapter code here
// Available variables:
// - element: The DOM element to render into
// - library: The loaded library (e.g., echarts)
// - ctx: Flow context
// - model: Current model instance

const chart = library.init(element);
chart.setOption({
  // your chart configuration
});`,
          },
        },
      },
      defaultParams: {
        adapterCode: `
// Example adapter code for ECharts
const chart = echarts.init(element);
const option = {
  title: { text: 'Cloud Component Demo' },
  tooltip: {},
  xAxis: { data: ['A', 'B', 'C', 'D', 'E'] },
  yAxis: {},
  series: [{
    name: 'Demo',
    type: 'bar',
    data: [5, 20, 36, 10, 10]
  }]
};
chart.setOption(option);
        `.trim(),
      },
      async handler(ctx: any, params: any) {
        const { libraryName } = ctx.stepResults.loadLibrary || {};

        if (!libraryName) {
          ctx.model.setProps('error', 'Library name not found');
          ctx.model.setProps('loading', false);
          return;
        }

        waitForRefCallback(ctx.model.ref, async (element: HTMLElement) => {
          try {
            // Load the library
            const library = await ctx.globals.requireAsync(libraryName);

            // Create a safe execution context for the adapter code
            const adapterFunction = new Function('element', 'library', libraryName, 'ctx', 'model', params.adapterCode);

            // Execute the adapter code
            await adapterFunction(element, library, library, ctx, ctx.model);

            ctx.model.setProps('loading', false);
          } catch (error: any) {
            console.error('Cloud component adapter error:', error);
            ctx.model.setProps('error', error.message);
            ctx.model.setProps('loading', false);
          }
        });
      },
    },
  },
});
