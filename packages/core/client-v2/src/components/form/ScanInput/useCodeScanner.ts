/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useCallback, useEffect, useState } from 'react';
import type { CodeFormatsToSupport } from './types';

type ScannerSize = {
  width: number;
  height: number;
};

type UseCodeScannerOptions = {
  enabled: boolean;
  elementId: string;
  formatsToSupport?: CodeFormatsToSupport;
  onScannerSizeChanged?: (size: ScannerSize) => void;
  onScanSuccess: (text: string) => void;
  onScanFailure?: () => void;
};

async function stopScanner(scanner?: Html5Qrcode, options: { clear?: boolean } = {}) {
  if (!scanner) {
    return;
  }

  const state = scanner.getState();
  if ([Html5QrcodeScannerState.SCANNING, Html5QrcodeScannerState.PAUSED].includes(state)) {
    await scanner.stop();
  }
  if (options.clear) {
    scanner.clear();
  }
}

export function useCodeScanner({
  enabled,
  elementId,
  formatsToSupport,
  onScannerSizeChanged,
  onScanSuccess,
  onScanFailure,
}: UseCodeScannerOptions) {
  const [scanner, setScanner] = useState<Html5Qrcode>();

  const startScanCamera = useCallback(
    async (scannerInstance: Html5Qrcode) => {
      await scannerInstance.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox(width, height) {
            onScannerSizeChanged?.({ width, height });
            return { width, height };
          },
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        undefined,
      );
    },
    [onScanSuccess, onScannerSizeChanged],
  );

  const startScanFile = useCallback(
    async (file: File) => {
      if (!scanner) {
        return;
      }

      await stopScanner(scanner);
      try {
        const result = await scanner.scanFileV2(file, false);
        onScanSuccess(result.decodedText);
      } catch (error) {
        onScanFailure?.();
        await startScanCamera(scanner);
      }
    },
    [onScanFailure, onScanSuccess, scanner, startScanCamera],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const scannerInstance = new Html5Qrcode(elementId, {
      formatsToSupport,
      verbose: false,
    });
    setScanner(scannerInstance);
    startScanCamera(scannerInstance).catch(() => {
      onScanFailure?.();
    });

    return () => {
      stopScanner(scannerInstance, { clear: true }).catch(() => undefined);
    };
  }, [elementId, enabled, formatsToSupport, onScanFailure, startScanCamera]);

  return {
    startScanFile,
  };
}
