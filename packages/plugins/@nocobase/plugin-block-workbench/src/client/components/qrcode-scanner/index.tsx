/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { LeftOutlined } from '@ant-design/icons';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useActionContext } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const QRCodeScannerInner = (props) => {
  const { t } = useTranslation('block-workbench');

  const containerRef = useRef<HTMLDivElement>();
  const navigate = useNavigate();
  useEffect(() => {
    document.documentElement.style.overscrollBehavior = 'none';
    return () => {
      document.documentElement.style.overscrollBehavior = 'default';
    };
  }, []);

  useEffect(() => {
    const scanner = new Html5Qrcode('qrcode');
    const init = async ({ width, height }: { width: number; height: number }) => {
      scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10, // Optional, frame per seconds for qr code scanning
          aspectRatio: height / width,
        },
        (text, result) => {
          navigate(text);
        },
        undefined,
      );
    };
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      console.log({ width, height });
      init({ width, height });
    }

    return () => {
      const state = scanner.getState();
      if ([Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(state)) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => alert(t('Unknown error')));
      }
    };
  }, [navigate]);

  return <div ref={containerRef} id="qrcode" style={{ width: '100%', height: '100%' }} />;
};

export const QRCodeScanner = (props) => {
  const { visible, setVisible } = useActionContext();
  const [cameraAvaliable, setCameraAvaliable] = useState(false);
  const { t } = useTranslation('block-workbench');

  useEffect(() => {
    const getCameras = async () => {
      try {
        const res = await Html5Qrcode.getCameras();
        if (res.length === 0) alert(t('No camera device detected'));
        else setCameraAvaliable(true);
      } catch (error) {
        const errMsgMap = {
          NotFoundError: t('No camera device detected'),
          NotAllowedError: t('You have not granted permission to use the camera'),
        };
        console.log(error);
        const msg = errMsgMap[error.name];
        alert(msg ?? error);
        setCameraAvaliable(false);
        setVisible(false);
      }
    };
    if (visible && !cameraAvaliable) getCameras();
  }, [visible, cameraAvaliable, setVisible, t]);
  const style: React.CSSProperties = {
    position: 'fixed',
    width: '100%',
    height: '100%',
    background: 'black',
    zIndex: '1001',
    top: 0,
    left: 0,
    overflow: 'hidden',
  };
  const backIconStyle: React.CSSProperties = {
    position: 'absolute',
    top: '22px',
    left: '20px',
    zIndex: '1003',
    color: 'white',
    fontSize: '1.8em',
    fontWeight: 'bold',
  };
  const titleStyle: React.CSSProperties = {
    position: 'absolute',
    color: 'white',
    fontSize: '1.5em',
    left: 0,
    right: 0,
    top: '20px',
    zIndex: '1002',
    marginLeft: 'auto',
    marginRight: 'auto',
    textAlign: 'center',
  };

  return visible && cameraAvaliable ? (
    <div style={style}>
      <QRCodeScannerInner />
      <LeftOutlined style={backIconStyle} onClick={() => setVisible(false)} />
      <div style={titleStyle}>{t('Scan QR code')}</div>
    </div>
  ) : null;
};
