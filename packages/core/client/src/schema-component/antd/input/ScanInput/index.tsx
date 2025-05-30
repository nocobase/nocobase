/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useRef } from 'react';
import { Input, Button, Space } from 'antd';
import { ScanOutlined } from '@ant-design/icons';
import { QRCodeScanner } from './QRCodeScanner';
import { useTranslation } from 'react-i18next';
import { NocoBaseInputProps } from '../Input';

const ScanInput: React.FC<NocoBaseInputProps> = ({ value, onChange, placeholder, disabled, disableManualInput }) => {
  const { t } = useTranslation();
  const [scanVisible, setScanVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScanSuccess = (text: any) => {
    setScanVisible(false);
    if (text) {
      onChange?.(text);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
  };

  return (
    <>
      <Input
        ref={inputRef as any}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        readOnly={disableManualInput}
        addonAfter={
          <ScanOutlined
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => {
              inputRef.current?.blur();
              setScanVisible(true);
            }}
            title={t('Scan to input')}
          />
        }
      />
      {scanVisible && (
        <QRCodeScanner
          visible={scanVisible}
          onScanSuccess={handleScanSuccess}
          onClose={() => {
            setScanVisible(false);
          }}
        />
      )}
    </>
  );
};

export { ScanInput };
