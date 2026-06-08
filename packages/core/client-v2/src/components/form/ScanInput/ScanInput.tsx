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

type JsBridgeScanResult = string | { url?: string; text?: string; value?: string };

type JsBridge = {
  invoke?: (params: { action: 'scan' }, callback: (data: JsBridgeScanResult) => void) => void;
};

function getJsBridgeScanText(data: JsBridgeScanResult) {
  if (typeof data === 'string') {
    return data;
  }
  return data.url || data.text || data.value || '';
}

export function ScanInput({
  value,
  onChange,
  disabled,
  disableManualInput,
  enableScan: _enableScan,
  formatsToSupport,
  onFocus,
  suffix,
  ...rest
}: ScanInputProps) {
  const { t } = useTranslation();
  const [scanVisible, setScanVisible] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const suppressInputFocusRef = useRef(false);

  const handleScanSuccess = (text: string) => {
    if (!text) {
      return;
    }
    onChange?.(text);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
  };

  const openScanner = () => {
    if (disabled) {
      return;
    }
    suppressInputFocusRef.current = true;
    inputRef.current?.blur();
    const releaseInputFocusSuppression = () => {
      window.setTimeout(() => {
        suppressInputFocusRef.current = false;
      }, 300);
    };
    const jsBridge = (window as Window & { JsBridge?: JsBridge }).JsBridge;
    if (jsBridge?.invoke) {
      jsBridge.invoke({ action: 'scan' }, (data) => {
        handleScanSuccess(getJsBridgeScanText(data));
      });
      releaseInputFocusSuppression();
      return;
    }
    setScanVisible(true);
    releaseInputFocusSuppression();
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (suppressInputFocusRef.current) {
      inputRef.current?.blur();
      event.preventDefault();
      return;
    }
    onFocus?.(event);
  };

  const handleScanButtonPointerDownCapture = (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    openScanner();
  };

  const handleScanButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    openScanner();
  };

  const scanButton = (
    <Tooltip title={t('Scan to input')}>
      <Button
        aria-label={t('Scan to input')}
        disabled={disabled}
        htmlType="button"
        icon={<ScanOutlined />}
        size="small"
        type="text"
        onClick={handleScanButtonClick}
        onPointerDownCapture={handleScanButtonPointerDownCapture}
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
        onFocus={handleInputFocus}
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
