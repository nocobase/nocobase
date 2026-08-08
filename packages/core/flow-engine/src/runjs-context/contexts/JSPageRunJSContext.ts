/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JSBlockRunJSContext } from './JSBlockRunJSContext';

export class JSPageRunJSContext extends JSBlockRunJSContext {}

JSPageRunJSContext.define({
  label: 'JS page RunJS context',
  properties: {
    page: {
      description: 'Stable facade for the current JS page. Internal route and application objects are not exposed.',
      detail: 'JSPageRuntimeFacade',
      properties: {
        uid: 'Stable page model uid (read-only).',
        active: 'Whether the page is currently active (read-only and evaluated live).',
        refresh: {
          type: 'function',
          description:
            'Request a page rerun. Concurrent requests are merged; a request made during a run schedules at most one follow-up and resolves immediately to avoid re-entrant deadlocks.',
          detail: '() => Promise<void>',
          completion: { insertText: 'await ctx.page.refresh()' },
        },
        setDocumentTitle: {
          type: 'function',
          description: 'Set the browser document title for the current active run.',
          detail: '(title: string) => void',
          completion: { insertText: "ctx.page.setDocumentTitle('Page title')" },
        },
      },
    },
    settings: 'Settings resolved for the active JS page source.',
    runJsSource: 'Metadata describing the active RunJS source and binding.',
  },
});

JSPageRunJSContext.define(
  {
    label: 'JS 页面 RunJS 上下文',
    properties: {
      page: {
        description: '当前 JS 页面的稳定接口，不暴露内部路由或 Application 对象。',
        detail: 'JSPageRuntimeFacade',
        properties: {
          uid: '稳定的页面模型 uid（只读）。',
          active: '页面当前是否激活（只读，实时计算）。',
          refresh: {
            type: 'function',
            description: '请求重新运行页面。并发请求会合并；运行期间最多排队一次后续刷新，并立即完成以避免重入死锁。',
            detail: '() => Promise<void>',
            completion: { insertText: 'await ctx.page.refresh()' },
          },
          setDocumentTitle: {
            type: 'function',
            description: '为当前激活运行设置浏览器文档标题。',
            detail: '(title: string) => void',
            completion: { insertText: "ctx.page.setDocumentTitle('页面标题')" },
          },
        },
      },
      settings: '当前 JS 页面源码解析后的设置。',
      runJsSource: '当前 RunJS 源码及绑定的元数据。',
    },
  },
  { locale: 'zh-CN' },
);
