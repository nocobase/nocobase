/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { FileImageOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { Spin, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { css } from '@emotion/css';

interface ScanCodeProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (text: string) => void;
}

const SCANNER_ID = 'qr-container';

export const ScanCode: React.FC<ScanCodeProps> = ({ visible, onClose, onSuccess }) => {
  const scannerRef = useRef<Html5Qrcode>();
  const containerRef = useRef<HTMLDivElement>();
  const imgUploaderRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const qrboxSize = Math.floor(Math.min(vw, vh) * 0.8);

  const startScan = useCallback(async () => {
    const scanner = new Html5Qrcode(SCANNER_ID);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: qrboxSize, height: qrboxSize },
        },
        (decodedText) => {
          onSuccess(decodedText);
          onClose();
        },
        undefined,
      );
    } catch (err) {
      console.error(err);
      setError(t('Camera access error or device not supported'));
    }
  }, [qrboxSize, onSuccess, onClose, t]);

  const stopScan = useCallback(async () => {
    try {
      const scanner = scannerRef.current;
      if (scanner && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
        await scanner.stop();
        await scanner.clear();
        scannerRef.current = undefined;
      }
    } catch (err) {
      console.warn('Stop scanner failed:', err);
    }
  }, []);

  const startScanFile = async (file: File) => {
    setLoading(true);
    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      const result = await scanner.scanFile(file, true);
      onSuccess(result);
      onClose();
    } catch (err) {
      console.error(err);
      message.error(t('Recognition failed. Try another image.'));
    } finally {
      setLoading(false);
      if (imgUploaderRef.current) imgUploaderRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      message.warning(t('Please select an image file.'));
      return;
    }
    if (file.size > 1024 * 1024) {
      message.warning(t('The image size is too large. Please compress it to below 1MB.'));
      return;
    }
    startScanFile(file);
  };

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
      startScan();
    }
    return () => {
      stopScan();
      document.body.style.overflow = 'auto';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.85)',
        overflow: 'hidden',
      }}
    >
      <div
        id={SCANNER_ID}
        style={{ width: '100%', height: '100%' }}
        ref={containerRef}
        className={css`
          video {
            height: ${vh}px;
          }
        `}
      />
      <CloseOutlined
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          fontSize: 20,
          color: 'white',
          cursor: 'pointer',
        }}
      />

      {/* 相册选择 */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          color: 'white',
          textAlign: 'center',
          cursor: 'pointer',
        }}
        onClick={() => imgUploaderRef.current?.click()}
      >
        <FileImageOutlined style={{ fontSize: '1.8em' }} />
        <div>{t('Album')}</div>
        <input
          ref={imgUploaderRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* 加载提示 */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            color: 'white',
          }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <div style={{ marginTop: 8 }}>{t('Recognizing...')}</div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            left: 0,
            right: 0,
            color: 'red',
            textAlign: 'center',
            fontSize: 16,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
