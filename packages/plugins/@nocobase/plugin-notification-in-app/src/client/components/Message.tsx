/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Avatar, List, Card } from 'antd';
import { css } from '@emotion/css';

const message = [
  {
    id: 'a',
    title: 'letmessage',
    content: 'hello',
    type: 'string',
  },
  {
    id: 'b',
    title: 'letmessage',
    content: 'hello',
    type: 'string',
  },
  {
    id: 'c',
    title: 'letmessage',
    content: 'hello',
    type: 'string',
  },
];

export default function Message() {
  return (
    <div style={{ background: 'rgba(55, 55, 55, 0.05)' }}>
      <List
        itemLayout="horizontal"
        dataSource={message}
        split={false}
        renderItem={(item, index) => (
          <List.Item>
            <Card>{item.content}</Card>
          </List.Item>
        )}
      />
    </div>
  );
}
