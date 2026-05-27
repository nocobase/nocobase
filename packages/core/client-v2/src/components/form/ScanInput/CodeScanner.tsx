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
import { Button, message, theme } from 'antd';
import { Html5Qrcode } from 'html5-qrcode';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ScanBox } from './ScanBox';
import type { CodeFormatsToSupport } from './types';
import { useCodeScanner } from './useCodeScanner';

type CodeScannerProps = {
  visible: boolean;
  formatsToSupport?: CodeFormatsToSupport;
  onClose: () => void;
  onScanSuccess: (result: string) => void;
};

const MAX_CODE_IMAGE_SIZE = 10 * 1024 * 1024;

function CodeScannerContent({ visible, formatsToSupport, onClose, onScanSuccess }: CodeScannerProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const inputId = useId().replace(/:/g, '');
  const scannerElementId = `code-scanner-${inputId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const imgUploaderRef = useRef<HTMLInputElement>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [originVideoSize, setOriginVideoSize] = useState({ width: 0, height: 0 });

  const viewport = useMemo(() => {
    const width = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const height = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    return { width, height };
  }, []);

  const showScanFailure = useCallback(() => {
    message.error(t('Code recognition failed, please scan again'));
  }, [t]);

  const handleScanSuccess = useCallback(
    (text: string) => {
      onScanSuccess(text);
      onClose();
    },
    [onClose, onScanSuccess],
  );

  const { startScanFile } = useCodeScanner({
    enabled: visible && cameraAvailable,
    elementId: scannerElementId,
    formatsToSupport,
    onScannerSizeChanged: setOriginVideoSize,
    onScanSuccess: handleScanSuccess,
    onScanFailure: showScanFailure,
  });

  useEffect(() => {
    if (!visible) {
      return;
    }

    let canceled = false;
    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (canceled) {
          return;
        }
        if (cameras.length > 0) {
          setCameraAvailable(true);
          return;
        }
        message.error(t('No camera device detected'));
        onClose();
      })
      .catch((error: Error) => {
        if (canceled) {
          return;
        }
        const errorMap: Record<string, string> = {
          NotFoundError: t('No camera device detected'),
          NotAllowedError: t('You have not granted permission to use the camera'),
        };
        message.error(errorMap[error.name] ?? error.message);
        onClose();
      });

    return () => {
      canceled = true;
    };
  }, [onClose, t, visible]);

  useEffect(() => {
    if (!visible || !originVideoSize.width || !originVideoSize.height) {
      return;
    }

    const video = containerRef.current?.querySelector('video');
    if (!video) {
      return;
    }

    const zoomRatio = viewport.height / originVideoSize.height;
    const zoomedWidth = Math.floor(zoomRatio * originVideoSize.width);
    video.style.height = `${viewport.height}px`;
    video.style.width = `${zoomedWidth}px`;
    if (containerRef.current) {
      containerRef.current.style.left = `${(viewport.width - zoomedWidth) / 2}px`;
      containerRef.current.style.position = 'absolute';
    }
  }, [originVideoSize, viewport.height, viewport.width, visible]);

  if (!visible) {
    return null;
  }

  const handleImageButtonClick = () => {
    imgUploaderRef.current?.click();
  };

  const handleImageUploaded = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_CODE_IMAGE_SIZE) {
      message.error(t('The image size is too large. Please compress it to below 10MB before uploading'));
      return;
    }

    startScanFile(file).catch(showScanFailure);
    event.target.value = '';
  };

  const scanBoxWidth = Math.floor(Math.min(viewport.width * 0.82, 520));
  const scanBoxHeight = Math.floor(Math.min(viewport.height * 0.32, 240));

  const rootClass = css`
    position: fixed;
    inset: 0;
    z-index: ${token.zIndexPopupBase + 1000};
    overflow: hidden;
    background: ${token.colorBgMask};
  `;
  const titleClass = css`
    position: absolute;
    top: ${token.paddingLG}px;
    right: ${token.paddingXXL}px;
    left: ${token.paddingXXL}px;
    z-index: ${token.zIndexPopupBase + 1002};
    color: ${token.colorTextLightSolid};
    font-size: ${token.fontSizeHeading4}px;
    font-weight: ${token.fontWeightStrong};
    line-height: ${token.lineHeightHeading4};
    text-align: center;
  `;
  const closeButtonClass = css`
    position: absolute;
    top: ${token.padding}px;
    left: ${token.padding}px;
    z-index: ${token.zIndexPopupBase + 1003};
    color: ${token.colorTextLightSolid};
  `;
  const albumClass = css`
    position: absolute;
    bottom: ${token.paddingLG}px;
    left: ${token.paddingLG}px;
    z-index: ${token.zIndexPopupBase + 1003};
    color: ${token.colorTextLightSolid};
  `;
  const hiddenInputClass = css`
    display: none;
  `;

  return (
    <div className={rootClass}>
      <div ref={containerRef} id={scannerElementId} style={{ position: 'absolute' }} />
      {cameraAvailable && (
        <>
          <ScanBox
            style={{
              position: 'fixed',
              top: `${(viewport.height - scanBoxHeight) / 2}px`,
              left: `${(viewport.width - scanBoxWidth) / 2}px`,
              width: `${scanBoxWidth}px`,
              height: `${scanBoxHeight}px`,
            }}
          />
          <div className={titleClass}>{t('Scan code')}</div>
          <Button
            aria-label={t('Close')}
            className={closeButtonClass}
            icon={<LeftOutlined />}
            type="text"
            onClick={onClose}
          />
          <Button className={albumClass} icon={<FileImageOutlined />} type="text" onClick={handleImageButtonClick}>
            {t('Album')}
          </Button>
          <input
            ref={imgUploaderRef}
            accept="image/*"
            className={hiddenInputClass}
            type="file"
            onChange={handleImageUploaded}
          />
        </>
      )}
    </div>
  );
}

export function CodeScanner(props: CodeScannerProps) {
  if (!props.visible) {
    return null;
  }

  return ReactDOM.createPortal(<CodeScannerContent {...props} />, document.body);
}
