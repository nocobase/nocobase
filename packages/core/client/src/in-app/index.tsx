/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { css } from '@emotion/css';
import { MailOutlined } from '@ant-design/icons';
import { Badge, Avatar } from 'antd';
import { useToken } from '..';
export const InApp = (props) => {
  const { token } = useToken();
  return (
    <div
      className={css`
        display: inline-block;
        vertical-align: top;
        width: 46px;
        height: 46px;
        &:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
      `}
    >
      <Badge count={5} size="small" offset={[-13, 15]}>
        <span
          data-testid="user-center-button"
          className={css`
            max-width: 160px;
            overflow: hidden;
            display: inline-block;
            line-height: 12px;
            white-space: nowrap;
            text-overflow: ellipsis;
          `}
          style={{ cursor: 'pointer', padding: '16px', color: token.colorTextHeaderMenu }}
        >
          <MailOutlined style={{ fontSize: '1.1em' }} />
        </span>
      </Badge>
    </div>
  );
};
