/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ScanOutlined } from '@ant-design/icons';
import { Input as AntdInput } from 'antd';
import { InputProps } from 'antd/es/input';
import React, { useState } from 'react';
import { ScanCode } from './ScanCode';

export type NocoBaseInputProps = InputProps & {
  trim?: boolean;
  disableManualInput?: boolean;
  enableScan?: boolean;
};

function ScanInput(props: NocoBaseInputProps) {
  const { onChange, trim, enableScan, disableManualInput, suffix, ...others } = props;
  const [scanVisible, setScanVisible] = useState(false);

  return (
    <>
      <AntdInput
        {...others}
        onChange={onChange}
        readOnly={disableManualInput}
        suffix={
          <>
            {suffix}
            {<ScanOutlined onClick={() => setScanVisible(true)} style={{ marginLeft: 8, cursor: 'pointer' }} />}
          </>
        }
      />
      <ScanCode
        visible={scanVisible}
        onClose={() => setScanVisible(false)}
        onSuccess={(result) => {
          onChange?.({ target: { value: result } } as any);
          setScanVisible(false); // 关闭扫码弹窗
        }}
      />
    </>
  );
}

export { ScanInput };
