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
  prefix: 'sn-jsb-antd-icons',
  label: 'Render Ant Design icons',
  description: 'Render Ant Design icons with buttons inside the block container',
  locales: {
    'zh-CN': {
      label: '渲染 Ant Design 图标',
      description: '在区块容器中使用 Ant Design 图标与按钮进行渲染',
    },
  },
  content: `
// Render Ant Design icons with buttons via ctx.libs
const { React, antd, antdIcons } = ctx.libs;
const { Button, Space } = antd;
const { PlusOutlined, EditOutlined, DeleteOutlined } = antdIcons;

const IconButtons = () => (
  <Space style={{ padding: 12 }}>
    <Button type="primary" icon={<PlusOutlined />}>
      {ctx.t('Add')}
    </Button>
    <Button icon={<EditOutlined />}>{ctx.t('Edit')}</Button>
    <Button danger icon={<DeleteOutlined />}>
      {ctx.t('Delete')}
    </Button>
  </Space>
);

ctx.render(<IconButtons />);
`,
};

export default snippet;
