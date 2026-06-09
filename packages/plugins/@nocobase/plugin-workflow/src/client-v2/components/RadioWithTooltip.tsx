/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * v2-native copy of the v1 `RadioWithTooltip` (mirrors `client/components/
 * RadioWithTooltip.tsx`). Same DOM/behaviour, but Formily-free: `css` comes from
 * `@emotion/css` and label compilation goes through the v2 `useT()` instead of
 * v1's `useCompile`. Used by the condition node's "Calculation engine" field.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Radio, Space, Tooltip } from 'antd';
import React from 'react';
import { useT } from '../locale';

export interface RadioWithTooltipOption {
  value: any;
  label: string;
  tooltip?: string;
}

export interface RadioWithTooltipProps {
  options?: RadioWithTooltipOption[];
  direction?: 'horizontal' | 'vertical';
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
}

export function RadioWithTooltip(props: RadioWithTooltipProps) {
  const { options = [], direction, ...other } = props;
  const compile = useT();

  return (
    <Radio.Group {...other}>
      <Space direction={direction}>
        {options.map((option) => (
          <Radio key={option.value} value={option.value}>
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
          </Radio>
        ))}
      </Space>
    </Radio.Group>
  );
}

export default RadioWithTooltip;
