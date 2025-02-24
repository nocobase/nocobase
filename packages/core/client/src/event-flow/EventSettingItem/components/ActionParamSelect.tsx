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

export function ActionParamSelect(props: { action: EventActionSetting['action'] }) {
  const { action, ...rest } = props;
  const { definitions } = useEvent();
  const definition = definitions.find(
    (x) => x.name === action?.definition && x.blockUid === action?.blockUid && x.pageUid === action?.pageUid,
  );
  const actionDef = definition?.actions?.find((x) => x.name === action.action);
  const params = actionDef?.params;
  const options = Object.keys(params || {}).map((key) => ({
    name: key,
    label: params[key]?.title,
    value: params[key]?.name || key,
    ...params[key],
  }));
  return <Select options={options} {...rest} style={{ minWidth: 150 }}></Select>;
}
