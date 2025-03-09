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
    const { tooltip } = props;

    if (!tooltip) {
      return <Component {...props} />;
    }

    return (
      <div style={titleWrapperStyle}>
        <Component {...props} />
        <Tooltip title={tooltip}>
          <QuestionCircleOutlined style={{ zIndex: 1 }} />
        </Tooltip>
      </div>
    );
  };
};
