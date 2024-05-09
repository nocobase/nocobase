/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { css, useCompile } from '@nocobase/client';
import { Checkbox, Space, Tooltip } from 'antd';
import React from 'react';

export interface CheckboxGroupWithTooltipOption {
  value: any;
  label: string;
  tooltip?: string;
}

export function CheckboxGroupWithTooltip(props) {
  const { options = [], direction, ...other } = props;
  const compile = useCompile();

  return (
    <Checkbox.Group {...other}>
      <Space direction={direction}>
        {options.map((option) => (
          <Checkbox key={option.value} value={option.value}>
            <span
              className={css`
                & + .anticon {
                  margin-left: 0.25em;
                }
              `}
            >
              {compile(option.label)}
            </span>
            {option.tooltip && (
              <Tooltip title={compile(option.tooltip)}>
                <QuestionCircleOutlined style={{ color: '#666' }} />
              </Tooltip>
            )}
          </Checkbox>
        ))}
      </Space>
    </Checkbox.Group>
  );
}
