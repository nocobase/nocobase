/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
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
  scanBoxSize?: ScannerSize;
  onScannerSizeChanged?: (size: ScannerSize) => void;
  onScanSuccess: (text: string) => void;
  onScanFailure?: () => void;
  onCameraStartFailure?: (error: unknown) => void;
};

const MAX_ENHANCED_SCAN_IMAGE_SIZE = 2048;
const MIN_UPSCALED_SCAN_IMAGE_SIZE = 1200;
const ENHANCED_SCAN_IMAGE_CONTRAST = 1.6;

export const DEFAULT_CODE_FORMATS: CodeFormatsToSupport = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.PDF_417,
];

export function getCodeScanBoxSize(width: number, height: number) {
  return {
    width: Math.floor(Math.min(width * 0.82, 520)),
    height: Math.floor(Math.min(height * 0.32, 240)),
  };
}

function getCameraScanBoxSize(scanBoxSize: ScannerSize | undefined, viewfinderWidth: number, viewfinderHeight: number) {
  const targetSize = scanBoxSize ?? getCodeScanBoxSize(viewfinderWidth, viewfinderHeight);

  return {
    width: Math.min(targetSize.width, Math.floor(viewfinderWidth)),
    height: Math.min(targetSize.height, Math.floor(viewfinderHeight)),
  };
}

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

function getScanImageScale(width: number, height: number) {
  const maxSize = Math.max(width, height);
  if (maxSize > MAX_ENHANCED_SCAN_IMAGE_SIZE) {
    return MAX_ENHANCED_SCAN_IMAGE_SIZE / maxSize;
  }
  if (maxSize < MIN_UPSCALED_SCAN_IMAGE_SIZE) {
    return Math.min(2, MIN_UPSCALED_SCAN_IMAGE_SIZE / maxSize);
  }
  return 1;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    image.onload = () => {
      cleanup();
      resolve(image);
    };
    image.onerror = (event) => {
      cleanup();
      reject(event);
    };
    image.onabort = (event) => {
      cleanup();
      reject(event);
    };
    image.src = url;
  });
}

function applyGrayscaleContrast(context: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = context.getImageData(0, 0, width, height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const value = Math.max(0, Math.min(255, (luminance - 128) * ENHANCED_SCAN_IMAGE_CONTRAST + 128));
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }

  context.putImageData(imageData, 0, 0);
}

function canvasToPngFile(canvas: HTMLCanvasElement, fileName: string) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to prepare image for code recognition'));
        return;
      }

      resolve(new File([blob], fileName.replace(/\.[^.]+$/, '') + '-scan.png', { type: 'image/png' }));
    }, 'image/png');
  });
}

async function createEnhancedScanFile(file: File) {
  if (!file.type.startsWith('image/')) {
    return;
  }

  const image = await loadImage(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  if (!width || !height) {
    return;
  }

  const scale = getScanImageScale(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  applyGrayscaleContrast(context, canvas.width, canvas.height);

  return canvasToPngFile(canvas, file.name);
}

async function scanFileWithFallback(scanner: Html5Qrcode, file: File) {
  try {
    return await scanner.scanFileV2(file, false);
  } catch (error) {
    const enhancedFile = await createEnhancedScanFile(file);
    if (!enhancedFile) {
      throw error;
    }

    return scanner.scanFileV2(enhancedFile, false);
  }
}

export function useCodeScanner({
  enabled,
  elementId,
  formatsToSupport,
  scanBoxSize,
  onScannerSizeChanged,
  onScanSuccess,
  onScanFailure,
  onCameraStartFailure,
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
            return getCameraScanBoxSize(scanBoxSize, width, height);
          },
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        undefined,
      );
    },
    [onScanSuccess, onScannerSizeChanged, scanBoxSize],
  );

  const startScanFile = useCallback(
    async (file: File) => {
      if (!scanner) {
        return;
      }

      await stopScanner(scanner);
      try {
        const result = await scanFileWithFallback(scanner, file);
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
      formatsToSupport: formatsToSupport?.length ? formatsToSupport : DEFAULT_CODE_FORMATS,
      verbose: false,
    });
    setScanner(scannerInstance);
    startScanCamera(scannerInstance).catch((error) => {
      if (onCameraStartFailure) {
        onCameraStartFailure(error);
        return;
      }
      onScanFailure?.();
    });

    return () => {
      stopScanner(scannerInstance, { clear: true }).catch(() => undefined);
    };
  }, [elementId, enabled, formatsToSupport, onCameraStartFailure, onScanFailure, startScanCamera]);

  return {
    startScanFile,
  };
}
