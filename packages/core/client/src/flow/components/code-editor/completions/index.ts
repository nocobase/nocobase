/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Completion } from '@codemirror/autocomplete';

export default [
  {
    label: 'ctx',
    type: 'class',
    info: 'Running context with all available APIs and utilities',
    detail: 'FlowRuntimeContext',
    boost: 110, // 核心入口，优先级最高
  },
  {
    label: 'ctx.api',
    type: 'class',
    info: 'APIClient instance for making HTTP requests.',
    detail: 'APIClient',
    boost: 100, // 次高优先级，常用功能
    apply: (view, completion) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: completion.label },
      });
    },
  },
  {
    label: 'ctx.api.request(options)',
    type: 'method',
    info: 'Make an HTTP request using the APIClient instance.',
    detail: 'Promise<any>',
    boost: 95, // 中等优先级，具体方法
    apply: (view, completion) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: 'await ctx.api.request({\n  url: "",\n  method: "get",\n  params: {}\n})' },
      });
    },
  },
  {
    label: 'ctx.element',
    type: 'property',
    info: 'Represents the current HTML element in the runtime context',
    detail: 'HTMLElement',
    boost: 110, // 核心属性，优先级最高
    apply: (view, completion) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: completion.label },
      });
    },
  },
  {
    label: 'ctx.element.innerHTML',
    type: 'property',
    info: 'Set the inner HTML content of the current HTML element in the runtime context.',
    detail: 'string',
    boost: 90, // 中等优先级，具体属性
    apply: (view, completion) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: 'ctx.element.innerHTML = `<h1>Hello, NocoBase!</h1>`;' },
      });
    },
  },
  {
    label: 'Basic HTML Template',
    type: 'snippet',
    info: 'Insert a basic HTML structure with padding and sample content.',
    detail: 'HTML Snippet',
    boost: 85, // 较低优先级，代码片段
    apply: `ctx.element.innerHTML = \`
  <div style="padding: 20px;">
    <h2>Hello World</h2>
    <p>This is a basic HTML template.</p>
  </div>
\`;`,
  },
  {
    label: 'API Response Snippet',
    type: 'snippet',
    info: 'Fetch data from an API and display it as formatted JSON in the current HTML element.',
    detail: 'API Request and Display',
    boost: 85, // 较低优先级，代码片段
    apply: `const response = await ctx.api.request({
  url: '/users',
  method: 'get',
  params: { page: 1, pageSize: 10 }
});

ctx.element.innerHTML = \`
  <pre>\${JSON.stringify(response.data, null, 2)}<pre/>
\``,
  },
  {
    label: 'ECharts Example Snippet',
    type: 'snippet',
    info: 'Insert an ECharts example with random data and responsive resizing.',
    detail: 'ECharts Snippet',
    boost: 85, // 较低优先级，代码片段
    apply: `ctx.element.style.height = '400px';
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) {
  return;
}
const chart = echarts.init(ctx.element);
// Generate random data
const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
const randomData = categories.map(() => Math.floor(Math.random() * 50) + 1);
const option = {
  title: { text: 'ECharts Example (Random Data)' },
  tooltip: {},
  xAxis: { data: categories },
  yAxis: {},
  series: [{ name: 'Sales', type: 'bar', data: randomData }],
};
chart.setOption(option);
chart.resize();
window.addEventListener('resize', () => chart.resize());`,
  },
  {
    label: 'I18n Example Snippet',
    type: 'snippet',
    info: 'Insert an example for internationalization using ctx.i18n.',
    detail: 'I18n Snippet',
    boost: 85, // 较低优先级，代码片段
    apply: `const zhCN = {
  hello: "你好",
  welcome_user: "欢迎，{{user}}！"
};
const enUS = {
  hello: "Hello",
  welcome_user: "Welcome, {{user}}!"
};

// Add Chinese resource bundle
ctx.i18n.addResourceBundle('zh-CN', 'ns1', zhCN, true, true);
// Add English resource bundle
ctx.i18n.addResourceBundle('en-US', 'ns1', enUS, true, true);

// Render localized content
ctx.element.innerHTML = ctx.t('welcome_user', { user: ctx.auth.user.nickname, ns: 'ns1' });`,
  },
  {
    label: 'ctx.i18n',
    type: 'class',
    info: 'An instance of i18next for managing internationalization.',
    detail: 'i18next',
    boost: 100, // 次高优先级，常用功能
    apply: (view, completion) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: completion.label },
      });
    },
  },
  {
    label: 'ctx.t(text, options)',
    type: 'method',
    info: 'Translate a given text key using the provided options.',
    detail: 'string',
    boost: 95, // 中等优先级，具体方法
    apply: (view, completion) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: 'ctx.t("key", { ns: "namespace" })' },
      });
    },
  },
  {
    label: 'ctx.element.querySelector(selector)',
    type: 'method',
    info: 'Find the first descendant element that matches the specified CSS selector.',
    detail: 'HTMLElement | null',
    boost: 85, // 较低优先级，具体方法
    apply: (view, completion) => {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: 'const child = ctx.element.querySelector(".child-class");' },
      });
    },
  },
  {
    label: 'Resource Example Snippet',
    type: 'snippet',
    info: 'Use a resource to fetch data and display it in the current HTML element.',
    detail: 'Resource Snippet',
    boost: 85, // 较低优先级，代码片段
    apply: `ctx.useResource('SingleRecordResource');
const resource = ctx.resource;
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.element.innerHTML = \`
  <pre>\${JSON.stringify(ctx.resource.getData(), null, 2)}</pre>
\`;`,
  },
] as Completion[];
