/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useToken, useSchemaSettingsRender } from '../../../';

export const UserCenterButton = () => {
  const { token } = useToken();
  return (
    <div
      className="nb-user-center"
      style={{ display: 'inline-block', verticalAlign: 'top', width: '46px', height: '46px' }}
    >
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
        <UserOutlined />
      </span>
    </div>
  );
};

export function UserCenter() {
  const { render } = useSchemaSettingsRender('userCenterSettings');
  return <div style={{ display: 'inline-block' }}>{render()}</div>;
}
