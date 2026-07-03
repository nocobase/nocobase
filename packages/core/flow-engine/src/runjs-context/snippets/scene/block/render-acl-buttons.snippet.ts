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
  prefix: 'sn-jsb-acl-buttons',
  label: 'ACL-controlled buttons',
  description: 'Render buttons controlled by ctx.acl.can permissions inside the block',
  locales: {
    'zh-CN': {
      label: '权限控制按钮',
      description: '在区块中使用 ctx.acl.can 控制按钮显示和禁用状态',
    },
  },
  content: `
const { React, antd, antdIcons } = ctx.libs;
const { Button, Space } = antd;
const { EyeOutlined, SaveOutlined, DeleteOutlined } = antdIcons;

const canView = ctx.acl.can({ resource: 'posts', action: 'read' });
const canSave = ctx.acl.can({ resource: 'posts', action: 'save' });
const canDelete = ctx.acl.can({ resource: 'posts', action: 'delete' });

ctx.render(
  <Space style={{ padding: 12 }}>
    {canView ? <Button icon={<EyeOutlined />}>View</Button> : null}
    <Button type="primary" icon={<SaveOutlined />} disabled={!canSave}>
      Save
    </Button>
    <Button danger icon={<DeleteOutlined />} disabled={!canDelete}>
      Delete
    </Button>
  </Space>
);
`,
};

export default snippet;
