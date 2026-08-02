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
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ScanBox } from './ScanBox';
import type { CodeFormatsToSupport } from './types';
import { getCodeScanBoxSize, useCodeScanner } from './useCodeScanner';

type CodeScannerProps = {
  visible: boolean;
  formatsToSupport?: CodeFormatsToSupport;
  onClose: () => void;
  onScanSuccess: (result: string) => void;
};

const MAX_CODE_IMAGE_SIZE = 10 * 1024 * 1024;
const SCANNER_RENDER_WIDTH = 1280;

function getViewportSize() {
  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
  };
}

function CodeScannerContent({ visible, formatsToSupport, onClose, onScanSuccess }: CodeScannerProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const inputId = useId().replace(/:/g, '');
  const scannerElementId = `code-scanner-${inputId}`;
  const imgUploaderRef = useRef<HTMLInputElement>(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [scannerSize, setScannerSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState(getViewportSize);

  const previewScale = scannerSize.width
    ? Math.max(viewport.width / scannerSize.width, viewport.height / scannerSize.height)
    : Math.min(1, viewport.width / SCANNER_RENDER_WIDTH);
  const visibleScanBoxSize = scannerSize.width
    ? getCodeScanBoxSize(viewport.width, viewport.height)
    : { width: 0, height: 0 };

  const showScanFailure = useCallback(() => {
    message.error(t('Code recognition failed, please scan again'));
  }, [t]);

  const showCameraStartFailure = useCallback(
    (error: unknown) => {
      const errorName = error instanceof Error ? error.name : '';
      const errorMessage = error instanceof Error ? error.message : '';
      const errorMap: Record<string, string> = {
        NotFoundError: t('No camera device detected'),
        NotAllowedError: t('You have not granted permission to use the camera'),
      };

      message.error(errorMap[errorName] || errorMessage || t('You have not granted permission to use the camera'));
      onClose();
    },
    [onClose, t],
  );

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
    onScannerSizeChanged: setScannerSize,
    onScanSuccess: handleScanSuccess,
    onScanFailure: showScanFailure,
    onCameraStartFailure: showCameraStartFailure,
  });

  useEffect(() => {
    const handleResize = () => setViewport(getViewportSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const rootClass = css`
    position: fixed;
    inset: 0;
    z-index: ${token.zIndexPopupBase + 1000};
    overflow: hidden;
    background: #000;
  `;
  const scannerWrapperClass = css`
    position: absolute;
    inset: 0;
    overflow: hidden;
  `;
  const scannerSurfaceClass = css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: center;
  `;
  const scannerClass = css`
    position: relative;
    width: 100%;
    line-height: 0;

    video {
      width: 100% !important;
      height: auto !important;
      max-width: none !important;
      display: block !important;
    }

    #qr-shaded-region {
      display: none !important;
    }
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
      <div className={scannerWrapperClass}>
        <div
          className={scannerSurfaceClass}
          style={{
            width: `${SCANNER_RENDER_WIDTH}px`,
            transform: `translate(-50%, -50%) scale(${previewScale})`,
          }}
        >
          <div id={scannerElementId} className={scannerClass} />
        </div>
      </div>
      {cameraAvailable && scannerSize.width > 0 && (
        <ScanBox
          style={{
            position: 'fixed',
            top: `${(viewport.height - visibleScanBoxSize.height) / 2}px`,
            left: `${(viewport.width - visibleScanBoxSize.width) / 2}px`,
            width: `${visibleScanBoxSize.width}px`,
            height: `${visibleScanBoxSize.height}px`,
          }}
        />
      )}
      <Button
        aria-label={t('Close')}
        className={closeButtonClass}
        icon={<LeftOutlined />}
        type="text"
        onClick={onClose}
      />
      {cameraAvailable && (
        <>
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
