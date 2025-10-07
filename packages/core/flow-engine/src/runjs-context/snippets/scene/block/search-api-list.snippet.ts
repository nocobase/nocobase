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
  prefix: 'sn-jsb-search',
  label: 'Search with API debounce',
  description: 'Provide a search input with debounced API request and list rendering',
  locales: {
    'zh-CN': {
      label: '搜索并防抖请求',
      description: '包含搜索输入框、防抖 API 请求与列表渲染的示例',
    },
  },
  content: `
const root = document.createElement('div');
root.style.padding = '16px';
root.style.background = '#fff';
root.style.borderRadius = '8px';
root.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
root.innerHTML = [
  '<label style="display:block;margin-bottom:8px;font-weight:600;">',
  ctx.t('Search users'),
  '</label>',
  '<input class="nb-search-input" style="width:100%;padding:6px 10px;border:1px solid #d9d9d9;border-radius:4px;" placeholder="',
  ctx.t('Enter keyword'),
  '" />',
  '<div class="nb-search-status" style="margin-top:12px;color:#888;">',
  ctx.t('Type to search...'),
  '</div>',
  '<ul class="nb-search-result" style="margin:12px 0 0;padding:0;list-style:none;"></ul>'
].join('');

ctx.element.replaceChildren(root);

const input = root.querySelector('.nb-search-input');
const status = root.querySelector('.nb-search-status');
const list = root.querySelector('.nb-search-result');

let timer = null;

const renderList = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    status.textContent = ctx.t('No results');
    list.innerHTML = '';
    return;
  }

  status.textContent = ctx.t('Found {{count}} result(s)', { count: items.length });
  list.innerHTML = items
    .map((item) => {
      const title = item.nickname || item.username || item.title || ctx.t('Untitled');
      return '<li style="padding:6px 0;border-bottom:1px solid #f0f0f0;">' + title + '</li>';
    })
    .join('');
};

const fetchData = async (keyword) => {
  if (!keyword) {
    status.textContent = ctx.t('Type to search...');
    list.innerHTML = '';
    return;
  }

  status.textContent = ctx.t('Loading...');
  list.innerHTML = '';

  try {
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
      params: {
        pageSize: 10,
        filter: keyword,
      },
    });
    const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
    renderList(rows);
  } catch (error) {
    console.error('[RunJS] search request failed', error);
    status.textContent = error?.message || ctx.t('Failed to load data');
  }
};

input?.addEventListener('input', (event) => {
  const value = event.target.value.trim();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => fetchData(value), 300);
});
`,
};

export default snippet;
