/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ScanOutlined } from '@ant-design/icons';
import { Input as AntdInput, Space } from 'antd';
import { InputProps } from 'antd/es/input';
import React from 'react';
import { scanCode } from './scanCode';

export type NocoBaseInputProps = InputProps & {
  trim?: boolean;
  disableManualInput?: boolean;
  enableScan?: boolean;
};

function ScanInput(props: NocoBaseInputProps) {
  const { onChange, trim, enableScan, disableManualInput, suffix, ...others } = props;

  const handleScanClick = async () => {
    const scannedValue = await scanCode();
    onChange?.({ target: { value: scannedValue } } as any);
  };

  return (
    <>
      <AntdInput
        {...others}
        onChange={onChange}
        readOnly={disableManualInput}
        suffix={
          <>
            {suffix}
            {<ScanOutlined onClick={handleScanClick} style={{ marginLeft: 8, cursor: 'pointer' }} />}
          </>
        }
      />
      <div id={'html5qr-code-full-region'} style={{ position: 'absolute' }} />
    </>
  );
}

export { ScanInput };
