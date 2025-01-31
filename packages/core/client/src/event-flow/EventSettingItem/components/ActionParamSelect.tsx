/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Select } from 'antd';
import { EventActionSetting } from '../../types';
import { useEvent } from '../../hooks/useEvent';
import React from 'react';

export function ActionParamSelect(props: { action: EventActionSetting }) {
  const { action, ...rest } = props;
  const { definitions } = useEvent();
  const params = definitions.find((x) => x.uid === action?.uid)?.actions?.find((x) => x.name === action.event)?.params;
  const options = Object.keys(params || {}).map((key) => ({
    name: key,
    label: params[key]?.title,
    value: params[key]?.name || key,
    ...params[key],
  }));
  console.log('ActionParamSelect', props);
  return <Select options={options} {...rest} style={{ minWidth: 150 }}></Select>;
}
