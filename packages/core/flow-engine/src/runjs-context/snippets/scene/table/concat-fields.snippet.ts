/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SnippetModule } from '../../types';
import { JSColumnRunJSContext } from '../../../contexts/JSColumnRunJSContext';

const snippet: SnippetModule = {
  contexts: [JSColumnRunJSContext],
  prefix: 'sn-col-concat',
  label: 'Concat two fields',
  description: 'Combine two field values into the current column cell',
  locales: {
    'zh-CN': {
      label: '拼接两个字段值',
      description: '在自定义列中拼接两个字段的值作为显示内容',
    },
  },
  content: `
// demo helper：根据当前列在 columns 中的位置，尝试获取前两个列的 dataIndex
// 实际使用时建议直接写死字段名，避免因为列顺序变化导致取值异常
function resolvePreviousDataIndexes() {
  const parent = ctx.model?.parent;
  const list = parent?.subModels?.columns;
  if (!Array.isArray(list)) return [];
  const currentUid = ctx.model?.uid;
  const currentIndex = list.findIndex((item) => item?.uid === currentUid);
  if (currentIndex <= 0) return [];
  return list
    .slice(Math.max(0, currentIndex - 2), currentIndex)
    .map((item) => (item && item.props ? item.props.dataIndex : undefined))
    .filter((key) => typeof key === 'string' && key.length > 0);
}

const [autoFieldA, autoFieldB] = resolvePreviousDataIndexes();

// Fallback: manually specify field keys when auto detection is not enough
const fieldA = autoFieldA || 'firstName';
const fieldB = autoFieldB || 'lastName';

const normalize = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).trim();
};

const valueA = normalize(ctx.record?.[fieldA]);
const valueB = normalize(ctx.record?.[fieldB]);

const parts = [valueA, valueB].filter((item) => item.length > 0);

ctx.element.textContent = parts.length ? parts.join(' / ') : ctx.t('N/A');
`,
};

export default snippet;
