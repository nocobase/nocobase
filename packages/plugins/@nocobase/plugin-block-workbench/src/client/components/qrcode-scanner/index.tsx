/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { FileImageOutlined, LeftOutlined } from '@ant-design/icons';
import { useActionContext } from '@nocobase/client';
import { Html5Qrcode } from 'html5-qrcode';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScanBox } from './ScanBox';
import { useScanner } from './useScanner';

const qrcodeEleId = 'qrcode';
export const QRCodeScannerInner = ({ setVisible }) => {
  const containerRef = useRef<HTMLDivElement>();
  const imgUploaderRef = useRef<HTMLInputElement>();
  const { t } = useTranslation('block-workbench');
  const [originVideoSize, setOriginVideoSize] = useState({ width: 0, height: 0 });
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  const onScanSuccess = useCallback(
    (text) => {
      setVisible(false);
    },
    [setVisible],
  );

  const { startScanFile } = useScanner({
    onScannerSizeChanged: setOriginVideoSize,
    elementId: qrcodeEleId,
    onScanSuccess,
  });

  const getBoxStyle = (): React.CSSProperties => {
    const size = Math.floor(Math.min(vw, vh) * 0.6);
    return {
      left: `${(vw - size) / 2}px`,
      top: `${(vh - size) / 2}px`,
      position: 'fixed',
      width: `${size}px`,
      height: `${size}px`,
    };
  };

  const onImgBtnClick = () => {
    if (imgUploaderRef.current) imgUploaderRef.current.click();
  };
  const onImgUploaded = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.size < 1000000) startScanFile(file);
      else alert(t('The image size is too large. Please compress it to below 1MB before uploading'));
    }
  };

  useEffect(() => {
    document.documentElement.style.overscrollBehavior = 'none';
    return () => {
      document.documentElement.style.overscrollBehavior = 'default';
    };
  }, []);

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
    return (
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', padding: '10px 60px' }}>
        <div
          style={{
            color: 'white',
            width: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <FileImageOutlined style={imageBtnStyle} onClick={onImgBtnClick} />
          {t('Album')}
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
  };
  const imageBtnStyle: React.CSSProperties = {
    zIndex: '1003',
    fontSize: '1.8em',
    fontWeight: 'bold',
  };

  return (
    <>
      <div ref={containerRef} id={qrcodeEleId} style={{ position: 'absolute' }} />
      <ScanBox style={{ ...getBoxStyle() }} />
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
      <QRCodeScannerInner setVisible={setVisible} />
      <LeftOutlined style={backIconStyle} onClick={() => setVisible(false)} />
      <div style={titleStyle}>{t('Scan QR code')}</div>
    </div>
  ) : null;
};
