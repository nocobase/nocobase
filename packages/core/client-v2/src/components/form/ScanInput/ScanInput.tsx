/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ScanOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import type { InputProps } from 'antd';
import type { InputRef } from 'antd/es/input';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CodeScanner } from './CodeScanner';
import type { CodeFormatsToSupport } from './types';

export type ScanInputProps = Omit<InputProps, 'onChange'> & {
  disableManualInput?: boolean;
  enableScan?: boolean;
  formatsToSupport?: CodeFormatsToSupport;
  onChange?: (value: string | React.ChangeEvent<HTMLInputElement>) => void;
};

export function ScanInput({
  value,
  onChange,
  disabled,
  disableManualInput,
  enableScan: _enableScan,
  formatsToSupport,
  suffix,
  ...rest
}: ScanInputProps) {
  const { t } = useTranslation();
  const [scanVisible, setScanVisible] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const handleScanSuccess = (text: string) => {
    if (!text) {
      return;
    }
    onChange?.(text);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
  };

  const scanButton = (
    <Tooltip title={t('Scan to input')}>
      <Button
        aria-label={t('Scan to input')}
        disabled={disabled}
        icon={<ScanOutlined />}
        size="small"
        type="text"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          inputRef.current?.blur();
          setScanVisible(true);
        }}
      />
    </Tooltip>
  );

  return (
    <>
      <Input
        {...rest}
        ref={inputRef}
        disabled={disabled}
        readOnly={disableManualInput || rest.readOnly}
        suffix={
          <>
            {suffix}
            {scanButton}
          </>
        }
        value={value}
        onChange={handleInputChange}
      />
      <CodeScanner
        formatsToSupport={formatsToSupport}
        visible={scanVisible}
        onClose={() => setScanVisible(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
}
