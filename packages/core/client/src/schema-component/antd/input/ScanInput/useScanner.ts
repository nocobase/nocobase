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
import { useTranslation } from 'react-i18next';

type ScannerSize = {
  width: number;
  height: number;
};

type UseScannerOptions = {
  enabled: boolean;
  elementId: string;
  scanBoxSize: ScannerSize;
  onScannerSizeChanged: (size: ScannerSize) => void;
  onScanSuccess?: (text: string) => void;
  onCameraStartFailure?: (error: unknown) => void;
};

const MIN_QR_SCAN_BOX_SIZE = 50;
const MAX_ENHANCED_SCAN_IMAGE_SIZE = 2048;
const MIN_UPSCALED_SCAN_IMAGE_SIZE = 1200;
const ENHANCED_SCAN_IMAGE_CONTRAST = 1.6;

function clampQrboxDimension(target: number, viewfinderSize: number) {
  const maxSize = Math.floor(viewfinderSize);
  const size = Math.min(Math.floor(target), maxSize);

  if (maxSize < MIN_QR_SCAN_BOX_SIZE) {
    return size;
  }

  return Math.max(size, MIN_QR_SCAN_BOX_SIZE);
}

export function getVisibleQRCodeScanBoxSize(viewportWidth: number, viewportHeight: number): ScannerSize {
  const size = Math.floor(Math.min(viewportWidth, viewportHeight) * 0.6);
  return { width: size, height: size };
}

export function getQRCodeScanBoxSize(
  scanBoxSize: ScannerSize,
  viewfinderWidth: number,
  viewfinderHeight: number,
): ScannerSize {
  return {
    width: clampQrboxDimension(scanBoxSize.width, viewfinderWidth),
    height: clampQrboxDimension(scanBoxSize.height, viewfinderHeight),
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

export function useScanner({
  enabled,
  onScannerSizeChanged,
  elementId,
  scanBoxSize,
  onScanSuccess,
  onCameraStartFailure,
}: UseScannerOptions) {
  const [scanner, setScanner] = useState<Html5Qrcode>();

  const { t } = useTranslation();

  const startScanCamera = useCallback(
    async (scannerInstance: Html5Qrcode) => {
      return scannerInstance.start(
        {
          facingMode: 'environment',
        },
        {
          fps: 10,
          qrbox(width, height) {
            onScannerSizeChanged({ width, height });
            return getQRCodeScanBoxSize(scanBoxSize, width, height);
          },
        },
        (text) => {
          onScanSuccess && onScanSuccess(text);
        },
        undefined,
      );
    },
    [onScannerSizeChanged, scanBoxSize, onScanSuccess],
  );

  const startScanFile = useCallback(
    async (file: File) => {
      if (!scanner) {
        return;
      }

      await stopScanner(scanner);
      try {
        const { decodedText } = await scanFileWithFallback(scanner, file);
        onScanSuccess && onScanSuccess(decodedText);
      } catch (error) {
        alert(t('QR code recognition failed, please scan again'));
        startScanCamera(scanner).catch((error) => {
          onCameraStartFailure?.(error);
        });
      }
    },
    [onCameraStartFailure, scanner, t, startScanCamera, onScanSuccess],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const el = document.getElementById(elementId);
    if (!el) return;

    const instance = new Html5Qrcode(elementId);
    setScanner(instance);
    startScanCamera(instance).catch((error) => {
      onCameraStartFailure?.(error);
    });

    return () => {
      stopScanner(instance, { clear: true }).catch(() => undefined);
    };
  }, [elementId, enabled, onCameraStartFailure, startScanCamera]);

  return { startScanCamera, startScanFile };
}
