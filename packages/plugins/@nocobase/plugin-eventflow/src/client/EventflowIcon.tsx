/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, Icon } from '@nocobase/client';
import { Button, Tooltip } from 'antd';
import React, { useContext } from 'react';
import { EventFlowContext } from './EventFlowProvider';

export const EventflowIcon = () => {
  const { active, setActive } = useContext(EventFlowContext);
  return (
    <Tooltip title={'Eventflow'}>
      <Button
        className={
          active &&
          css`
            color: #4096ff !important;
            border-color: #4096ff !important;
            background: rgba(255, 255, 255, 0.1) !important;
          `
        }
        icon={<Icon type={'ThunderboltOutlined'} />}
        onClick={() => {
          setActive(!active);
        }}
      />
    </Tooltip>
  );
};
