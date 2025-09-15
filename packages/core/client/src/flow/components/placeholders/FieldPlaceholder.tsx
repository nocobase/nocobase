/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, Form } from 'antd';
import React from 'react';

export function FieldPlaceholder() {
  return (
    <Form.Item>
      <Card
        size="small"
        styles={{
          body: {
            color: 'rgba(0,0,0,0.45)',
          },
        }}
      >
        该字段已被隐藏，你无法查看（该内容仅在激活 UI Editor 时显示）。
      </Card>
    </Form.Item>
  );
}
