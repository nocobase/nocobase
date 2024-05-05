/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { usePrefixCls } from '@formily/antd-v5/esm/__builtins__';
import { toArr } from '@formily/shared';
import dayjs from 'dayjs';
import cls from 'classnames';
import React from 'react';

export interface TimePickerReadPrettyProps {
  format?: string;
  style?: React.CSSProperties;
  value: string | string[];
  className?: string;
  prefixCls?: string;
}

export const ReadPretty: React.FC<TimePickerReadPrettyProps> = (props) => {
  const { value, format = 'HH:mm:ss' } = props;
  const prefixCls = usePrefixCls('description-text', props);
  const values = toArr(value);
  const getLabels = () => {
    const labels = values.map((v) => dayjs(v, 'HH:mm:ss').format(format));
    return labels.join('~');
  };
  return (
    <div className={cls(prefixCls, props.className)} style={props.style}>
      {getLabels()}
    </div>
  );
};
