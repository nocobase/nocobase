/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { Cascader } from 'antd';
import React from 'react';
import { useActionOptions } from '../hooks/useActionOptions';
import { EventActionSetting } from '../../types';

export const ActionSelect = observer((props: any) => {
  const options = useActionOptions();
  const { onChange, value, ...rest } = props;
  const _onChange = (value: any, selectedOptions: any) => {
    const v = value[1];
    if (v) {
      const res: EventActionSetting = {
        definition: v.split('.')[0],
        event: v.split('.')[1],
        uid: v.split('.')[2],
      };
      onChange?.(res);
    } else {
      onChange?.(undefined);
    }
  };
  const _value = value ? [value.definition, `${value.definition}.${value.event}.${value.uid}`] : [];
  return (
    <Cascader
      placeholder="请选择动作"
      options={options}
      onChange={_onChange}
      value={_value}
      style={{ minWidth: 300 }}
      {...rest}
    />
  );
});
