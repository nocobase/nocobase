/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapReadPretty } from '@formily/react';
import React from 'react';
import { DatePicker } from '../date-picker';

interface UnixTimestampProps {
  value?: any;
  onChange?: (value: number) => void;
}

export const UnixTimestamp = connect(
  (props: UnixTimestampProps) => {
    const { value, onChange } = props;
    return (
      <DatePicker
        picker={'date'}
        {...props}
        value={value}
        onChange={(v: any) => {
          if (onChange) {
            onChange(v);
          }
        }}
      />
    );
  },
  mapReadPretty((props) => {
    const { value } = props;
    return <DatePicker.ReadPretty {...props} value={value} />;
  }),
);
