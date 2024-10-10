/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Avatar, List } from 'antd';
import { css } from '@emotion/css';
const messageData = [
  { id: 'workflow1', unreadCnt: 20 },
  { id: 'workflow2', unreadCnt: 20 },
  { id: 'workflow3', unreadCnt: 20 },
];

const Contacts = () => {
  const message = messageData.map((item) => ({ ...item, title: 'workflow' }));
  return (
    <div>
      <List
        itemLayout="horizontal"
        dataSource={message}
        renderItem={(item, index) => (
          <List.Item
            className={css`
              &:hover {
                background: rgba(55, 55, 55, 0.05);
              }
            `}
          >
            <List.Item.Meta
              title={'workflow'}
              description="workflow"
              avatar={<Avatar src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`} />}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default Contacts;
