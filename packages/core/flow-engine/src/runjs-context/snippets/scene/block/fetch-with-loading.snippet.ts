/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSBlockRunJSContext } from '../../../contexts/JSBlockRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSBlockRunJSContext],
  prefix: 'sn-jsb-fetch-state',
  label: 'Fetch with loading & error',
  description: 'Load remote data, render a simple list, and handle loading/error states',
  locales: {
    'zh-CN': {
      label: '加载数据并显示列表',
      description: '演示加载状态、错误提示以及将接口数据渲染为列表',
    },
  },
  content: `
const container = document.createElement('div');
container.style.padding = '16px';
container.style.background = '#fff';
container.style.borderRadius = '8px';
container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
ctx.element.replaceChildren(container);

const renderLoading = () => {
  container.innerHTML = '<div style="color:#888;">' + ctx.t('Loading...') + '</div>';
};

const renderError = (message) => {
  container.innerHTML = '<div style="color:#c00;">' + message + '</div>';
};

const renderList = (items) => {
  if (!items.length) {
    container.innerHTML = '<div style="color:#888;">' + ctx.t('No data yet') + '</div>';
    return;
  }

  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.padding = '0';
  list.style.margin = '0';

  items.forEach((item) => {
    const li = document.createElement('li');
    li.style.padding = '8px 0';
    li.style.borderBottom = '1px solid #f0f0f0';
    li.innerHTML = '<strong>' + item.username + '</strong>';
    list.appendChild(li);
  });

  container.replaceChildren(list);
};

async function main() {
  renderLoading();
  try {
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
      params: {
        pageSize: 5,
      },
    });
    const items = Array.isArray(response?.data?.data) ? response.data.data : [];
    renderList(items);
  } catch (error) {
    console.error('[RunJS] fetch list failed', error);
    renderError(error?.message || ctx.t('Failed to load data'));
  }
}

main();
`,
};

export default snippet;
