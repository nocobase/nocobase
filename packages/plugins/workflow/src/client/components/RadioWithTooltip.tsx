import React from 'react';
import { Radio, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from "@emotion/css";

import { useCompile } from '@nocobase/client';



export function RadioWithTooltip(props) {
  const { options = [], ...other } = props;
  const compile = useCompile();

  return (
    <Radio.Group {...other}>
      {options.map((option) => (
        <Radio key={option.value} value={option.value}>
          <span className={css`
            & + .anticon {
              margin-left: .25em;
            }
          `}>
            {compile(option.label)}
          </span>
          {option.tooltip && (
            <Tooltip title={compile(option.tooltip)}>
              <QuestionCircleOutlined style={{ color: '#666' }} />
            </Tooltip>
          )}
        </Radio>
      ))}
    </Radio.Group>
  );
}
