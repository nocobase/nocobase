/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { LeftOutlined, FileImageOutlined } from '@ant-design/icons';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { useActionContext } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const QRCodeScannerInner = (props) => {
  const { t } = useTranslation('block-workbench');

  const containerRef = useRef<HTMLDivElement>();
  const navigate = useNavigate();
  const imgUploaderRef = useRef<HTMLInputElement>();
  const [scanner, setScanner] = useState<Html5Qrcode>();
  const [originVideoSize, setOriginVideoSize] = useState({ width: 0, height: 0 });
  const [scannerRendered, setScannerRendered] = useState(false);
  const onImgBtnClick = () => {
    if (imgUploaderRef.current) imgUploaderRef.current.click();
  };
  const onImgUploaded = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files.length > 0) {
      const state = scanner.getState();
      if ([Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(state)) {
        const file = files[0];
        scanner
          .stop()
          .then(() => {
            scanner.clear();
            return scanner.scanFileV2(file, false);
          })
          .then(({ decodedText, result }) => {
            navigate(decodedText);
          })
          .catch(() => alert(t('Unknown error')));
      }
    }
  };
  useEffect(() => {
    document.documentElement.style.overscrollBehavior = 'none';
    return () => {
      document.documentElement.style.overscrollBehavior = 'default';
    };
  }, []);

  useEffect(() => {
    const scanner = new Html5Qrcode('qrcode');
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const aspectRatio = vh / vw;
    setScanner(scanner);
    const init = async () => {
      await scanner.start(
        {
          facingMode: 'environment',
        },
        {
          fps: 10,
          qrbox(width, height) {
            const minEdge = Math.min(width, height);
            const zoomRatio = vh / height;
            const qrcodeSize = Math.floor((minEdge * 0.6) / zoomRatio);
            setOriginVideoSize({ width, height });
            return { width: qrcodeSize, height: qrcodeSize };
          },
        },
        (text, result) => {
          navigate(text);
        },
        undefined,
      );
      setScannerRendered(true);
    };
    init();
    return () => {
      const state = scanner.getState();
      if ([Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(state)) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => alert(t('Unknown error')));
      }
    };
  }, [navigate, t]);

  useEffect(() => {
    const { width, height } = originVideoSize;
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    if (width > 0 && height > 0 && height < vh) {
      const zoomRatio = vh / height;
      const zoomedWidth = Math.floor(zoomRatio * width);
      const video = document.getElementsByTagName('video')[0];
      video.style.height = `${vh}px`;
      video.style.width = `${zoomedWidth}px`;
      containerRef.current.style.left = `${(vw - zoomedWidth) / 2}px`;
      containerRef.current.style.position = `absolute`;
    }
  }, [originVideoSize]);

  const ToolBar = () => {
    if (scannerRendered) {
      return (
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', padding: '10px 60px' }}>
          <div
            style={{
              color: 'white',
              width: '40px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <FileImageOutlined style={imageBtnStyle} onClick={onImgBtnClick} />
            相册
            <input
              ref={imgUploaderRef}
              type="file"
              accept="image/*"
              onChange={onImgUploaded}
              style={{ visibility: 'hidden' }}
            />
          </div>
        </div>
      );
    } else return null;
  };
  const imageBtnStyle: React.CSSProperties = {
    zIndex: '1003',
    fontSize: '1.8em',
    fontWeight: 'bold',
  };

  return (
    <>
      <div ref={containerRef} id="qrcode" style={{ position: 'absolute' }} />
      <ToolBar />
    </>
  );
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
