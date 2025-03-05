/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const titleWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

export const withTooltipComponent = (Component: React.FC) => {
  return (props) => {
    const { schema } = props;
    const tooltip = schema?.['x-component-props']?.tooltip;

    if (!tooltip) {
      return <Component {...props} />;
    }

    // 不破坏原菜单css样式
    if (
      schema?.['x-component'] === 'Menu.Item' ||
      schema?.['x-component'] === 'Menu.URL' ||
      schema?.['x-component'] === 'Menu.SubMenu'
    ) {
      return (
        <>
          <Component {...props} />
          <Tooltip title={tooltip}>
            <QuestionCircleOutlined style={{ marginInlineStart: '4px' }} />
          </Tooltip>
        </>
      );
    }

    return (
      <div style={titleWrapperStyle}>
        <Component {...props} />
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined />
        </Tooltip>
      </div>
    );
  };
};
