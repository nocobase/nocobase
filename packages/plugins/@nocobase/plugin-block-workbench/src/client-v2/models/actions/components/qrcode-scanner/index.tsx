/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { FileImageOutlined, LeftOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { theme } from 'antd';
import { Html5Qrcode } from 'html5-qrcode';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScanBox } from './ScanBox';
import { useScanner } from './useScanner';

const qrcodeEleId = 'qrcode';
type QRCodeScannerInnerProps = {
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  app?: any;
  navigate: (path: string) => void;
  onClose?: () => void;
  t: (key: string, options?: Record<string, any>) => string;
};

export const QRCodeScannerInner = ({ setVisible, app, navigate, onClose, t }: QRCodeScannerInnerProps) => {
  const containerRef = useRef<HTMLDivElement>();
  const imgUploaderRef = useRef<HTMLInputElement>();
  const { token } = theme.useToken();
  const [originVideoSize, setOriginVideoSize] = useState({ width: 0, height: 0 });
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  const onScanSuccess = useCallback(
    (text) => {
      setVisible(false);
      onClose?.();
    },
    [onClose, setVisible],
  );

  const { startScanFile } = useScanner({
    onScannerSizeChanged: setOriginVideoSize,
    elementId: qrcodeEleId,
    onScanSuccess,
    app,
    navigate,
    t,
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
    const toolbarClass = css`
      position: absolute;
      bottom: ${token.paddingLG}px;
      left: ${token.paddingLG}px;
      padding: ${token.paddingXS}px ${token.paddingXL}px;
    `;
    const toolbarItemClass = css`
      color: ${token.colorTextLightSolid};
      width: ${token.controlHeightLG}px;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;
    const hiddenInputClass = css`
      visibility: hidden;
    `;

    return (
      <div className={toolbarClass}>
        <div className={toolbarItemClass}>
          <FileImageOutlined className={imageBtnClass} onClick={onImgBtnClick} />
          {t('Album')}
          <input
            ref={imgUploaderRef}
            type="file"
            accept="image/*"
            onChange={onImgUploaded}
            className={hiddenInputClass}
          />
        </div>
      </div>
    );
  };
  const imageBtnClass = css`
    z-index: ${token.zIndexPopupBase + 3};
    font-size: ${token.fontSizeHeading2}px;
    font-weight: ${token.fontWeightStrong};
  `;
  const qrcodeClass = css`
    position: absolute;
  `;

  return (
    <>
      <div ref={containerRef} id={qrcodeEleId} className={qrcodeClass} />
      <ScanBox style={{ ...getBoxStyle() }} />
      <ToolBar />
    </>
  );
};
