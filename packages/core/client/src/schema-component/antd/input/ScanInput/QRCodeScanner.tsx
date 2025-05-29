/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { LeftOutlined, FileImageOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useScanner } from './useScanner';
export function ScanBox({ style = {} }: { style: React.CSSProperties }) {
  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: 'rgb(255, 255, 255)',
  };
  return (
    <div id="qr-scan-box" style={{ boxSizing: 'border-box', inset: '0px', ...style }}>
      <div style={{ width: '40px', height: '5px', top: '-5px', left: '0px', ...commonStyle }}></div>
      <div style={{ width: '40px', height: '5px', top: '-5px', right: '0px', ...commonStyle }}></div>
      <div style={{ width: '40px', height: '5px', bottom: '-5px', left: '0px', ...commonStyle }}></div>
      <div style={{ width: '40px', height: '5px', bottom: '-5px', right: '0px', ...commonStyle }}></div>
      <div style={{ width: '5px', height: '45px', top: '-5px', left: '-5px', ...commonStyle }}></div>
      <div style={{ width: '5px', height: '45px', bottom: '-5px', left: '-5px', ...commonStyle }}></div>
      <div style={{ width: '5px', height: '45px', top: '-5px', right: '-5px', ...commonStyle }}></div>
      <div style={{ width: '5px', height: '45px', bottom: '-5px', right: '-5px', ...commonStyle }}></div>
    </div>
  );
}

interface QRCodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (result: string) => void;
}

const qrcodeEleId = 'qrcode-scanner';

const QRCodeScannerInner = ({ visible, onClose, onScanSuccess, containerRef }) => {
  const imgUploaderRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation('block-workbench');
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [originVideoSize, setOriginVideoSize] = useState({ width: 0, height: 0 });

  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  const { startScanFile } = useScanner({
    elementId: qrcodeEleId,
    onScannerSizeChanged: setOriginVideoSize,
    onScanSuccess: (text) => {
      onScanSuccess(text);
      onClose();
    },
  });

  useEffect(() => {
    if (!visible) return;
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cameras.length > 0) {
          setCameraAvailable(true);
        } else {
          alert(t('No camera device detected'));
          onClose();
        }
      })
      .catch((error) => {
        const errorMap = {
          NotFoundError: t('No camera device detected'),
          NotAllowedError: t('You have not granted permission to use the camera'),
        };
        alert(errorMap[error.name] ?? error.message);
        onClose();
      });
  }, [visible, t, onClose]);

  useEffect(() => {
    if (!visible || !originVideoSize.width || !originVideoSize.height) return;
    const video = document.querySelector('video');
    if (video) {
      const zoomRatio = vh / originVideoSize.height;
      const zoomedWidth = zoomRatio * originVideoSize.width;
      video.style.height = `${vh}px`;
      video.style.width = `${zoomedWidth}px`;
      if (containerRef.current) {
        containerRef.current.style.left = `${(vw - zoomedWidth) / 2}px`;
        containerRef.current.style.position = `absolute`;
      }
    }
  }, [originVideoSize, visible]);

  if (!visible || !cameraAvailable) return null;
  const handleImgClick = () => {
    imgUploaderRef.current?.click();
  };

  const handleImgUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size < 1024 * 1024) {
      startScanFile(file);
    } else {
      alert(t('The image size is too large. Please compress it to below 1MB before uploading'));
    }
  };
  return (
    <div>
      <ScanBox
        style={{
          position: 'fixed',
          top: `${(vh - vw * 0.6) / 2}px`,
          left: `${(vw - vw * 0.6) / 2}px`,
          width: `${vw * 0.6}px`,
          height: `${vw * 0.6}px`,
        }}
      />

      {/* 左上返回按钮 */}
      <LeftOutlined
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '22px',
          left: '20px',
          zIndex: 1003,
          color: 'white',
          fontSize: '1.8em',
          fontWeight: 'bold',
        }}
      />

      {/* 标题 */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: 0,
          right: 0,
          color: 'white',
          fontSize: '1.5em',
          textAlign: 'center',
          zIndex: 1002,
        }}
      >
        {t('Scan QR code')}
      </div>

      {/* 相册按钮 */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          padding: '10px 60px',
        }}
      >
        <div
          style={{
            color: 'white',
            width: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <FileImageOutlined style={{ fontSize: '1.8em', fontWeight: 'bold', zIndex: 1003 }} onClick={handleImgClick} />
          {t('Album')}
          <input
            type="file"
            accept="image/*"
            ref={imgUploaderRef}
            onChange={handleImgUploaded}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export const QRCodeScanner: React.FC<QRCodeScannerProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'black',
        zIndex: 1001,
        overflow: 'hidden',
      }}
    >
      {/* 扫码区域 */}
      <div ref={containerRef} id={qrcodeEleId} style={{ position: 'absolute' }} />
      <QRCodeScannerInner {...props} containerRef={containerRef} />
    </div>
  );
};
