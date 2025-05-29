/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useScanner({ onScannerSizeChanged, elementId, onScanSuccess }) {
  const [scanner, setScanner] = useState<Html5Qrcode>();

  const { t } = useTranslation();
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
          onScanSuccess && onScanSuccess(text);
        },
        undefined,
      );
    },
    [onScannerSizeChanged, viewPoint, onScanSuccess],
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
        onScanSuccess && onScanSuccess(decodedText);
      } catch (error) {
        alert(t('QR code recognition failed, please scan again'));
        startScanCamera(scanner);
      }
    },
    [stopScanner, scanner, t, startScanCamera, onScanSuccess],
  );

  useEffect(() => {
    const el = document.getElementById(elementId);
    if (!el) return; // 容器还没挂载，跳过
    if (scanner) return; // 避免重复初始化

    const instance = new Html5Qrcode(elementId);
    setScanner(instance);

    startScanCamera(instance);

    return () => {
      stopScanner(instance);
    };
  }, [elementId, scanner, startScanCamera, stopScanner]);

  return { startScanCamera, startScanFile };
}
