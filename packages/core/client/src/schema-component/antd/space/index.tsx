/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFormLayout } from '@formily/antd-v5';
import { Space as AntdSpace, Divider, SpaceProps } from 'antd';
import React from 'react';

export const Space: React.FC<SpaceProps> = (props) => {
  let { split } = props;
  if (split === '|') {
    split = '';
  }
  const layout = useFormLayout();
  return React.createElement(AntdSpace, {
    size: props.size ?? layout?.spaceGap,
    ...props,
    split,
  });
};

export default Space;
