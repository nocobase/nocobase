/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function useScanner({ onScannerSizeChanged, elementId }) {
  const [scanner, setScanner] = useState<Html5Qrcode>();
  const navigate = useNavigate();
  const { t } = useTranslation('block-workbench');
  const viewPoint = useMemo(() => {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    return { width: vw, height: vh };
  }, []);

  const startScanCamera = useCallback(
    async (scanner: Html5Qrcode) => {
      return scanner.start(
        {
          facingMode: 'environment',
        },
        {
          fps: 10,
          qrbox(width, height) {
            const minEdge = Math.min(width, height);
            onScannerSizeChanged({ width, height });
            return { width: viewPoint.width, height: viewPoint.height };
          },
        },
        (text) => {
          navigate(text);
        },
        undefined,
      );
    },
    [navigate, onScannerSizeChanged, viewPoint],
  );
  const stopScanner = useCallback(async (scanner: Html5Qrcode) => {
    const state = scanner.getState();
    if ([Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(state)) {
      return scanner.stop();
    } else return;
  }, []);

  const startScanFile = useCallback(
    async (file: File) => {
      await stopScanner(scanner);
      try {
        const { decodedText } = await scanner.scanFileV2(file, false);
        navigate(decodedText);
      } catch (error) {
        alert(t('QR code recognition failed, please scan again'));
        startScanCamera(scanner);
      }
    },
    [scanner, stopScanner, startScanCamera, t, navigate],
  );

  useEffect(() => {
    const scanner = new Html5Qrcode(elementId);
    setScanner(scanner);
    startScanCamera(scanner);
    return () => {
      stopScanner(scanner);
    };
  }, [elementId, startScanCamera, stopScanner]);
  return { startScanCamera, startScanFile };
}
