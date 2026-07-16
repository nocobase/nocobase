/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import jsQR from 'jsqr';
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

type ImageDataVariant = {
  imageData: ImageData;
  maxSize: number;
};

type JsQRImageTransform = {
  contrast?: number;
  threshold?: number;
};

const QR_SCAN_IMAGE_SIZES = [3200, 2400, 1600, 1000];
const QR_SCAN_IMAGE_TRANSFORMS: JsQRImageTransform[] = [
  {},
  { contrast: 3, threshold: 105 },
  { contrast: 2, threshold: 105 },
  { contrast: 3, threshold: 120 },
  { contrast: 2, threshold: 120 },
  { contrast: 3, threshold: 90 },
  { contrast: 4, threshold: 105 },
];

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

function clampCodeScanBoxSize(scanBoxSize: ScannerSize, width: number, height: number) {
  return {
    width: Math.min(scanBoxSize.width, width),
    height: Math.min(scanBoxSize.height, height),
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

function isSafariBrowser() {
  const { userAgent, vendor } = navigator;
  return /Apple/i.test(vendor) && /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|Chrome/i.test(userAgent);
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

function getScanImageSizes(naturalWidth: number, naturalHeight: number) {
  const maxSize = Math.max(naturalWidth, naturalHeight);
  const cappedMaxSize = Math.min(maxSize, QR_SCAN_IMAGE_SIZES[0]);
  return Array.from(new Set([cappedMaxSize, ...QR_SCAN_IMAGE_SIZES.filter((size) => size < cappedMaxSize)])).sort(
    (a, b) => b - a,
  );
}

function getImageDataFromImage(image: HTMLImageElement, maxSize: number): ImageDataVariant | undefined {
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  const scale = Math.min(1, maxSize / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.drawImage(image, 0, 0, width, height);
  return {
    imageData: context.getImageData(0, 0, width, height),
    maxSize,
  };
}

async function getImageDataVariants(file: File) {
  const image = await loadImage(file);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  if (!naturalWidth || !naturalHeight) {
    return;
  }

  return getScanImageSizes(naturalWidth, naturalHeight)
    .map((maxSize) => getImageDataFromImage(image, maxSize))
    .filter((variant): variant is ImageDataVariant => !!variant);
}

function getTransformedImageData(imageData: ImageData, transform: JsQRImageTransform) {
  const { contrast = 1, threshold } = transform;
  if (contrast === 1 && threshold == null) {
    return imageData.data;
  }

  const data = new Uint8ClampedArray(imageData.data);
  for (let index = 0; index < data.length; index += 4) {
    let luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    luminance = Math.max(0, Math.min(255, (luminance - 128) * contrast + 128));
    if (threshold != null) {
      luminance = luminance < threshold ? 0 : 255;
    }
    data[index] = luminance;
    data[index + 1] = luminance;
    data[index + 2] = luminance;
  }
  return data;
}

async function scanFileWithJsQR(file: File, formatsToSupport?: CodeFormatsToSupport) {
  const formats = formatsToSupport?.length ? formatsToSupport : DEFAULT_CODE_FORMATS;
  if (!formats.includes(Html5QrcodeSupportedFormats.QR_CODE)) {
    throw new Error('QR_CODE is not included in the requested formats');
  }

  const variants = await getImageDataVariants(file);
  if (!variants?.length) {
    throw new Error('Failed to prepare uploaded image for QR decoding');
  }

  for (const { imageData } of variants) {
    for (const transform of QR_SCAN_IMAGE_TRANSFORMS) {
      const data = getTransformedImageData(imageData, transform);
      const qrCode = jsQR(data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
      if (qrCode?.data) {
        return qrCode.data;
      }
    }
  }

  throw new Error('No QR code decoded by jsQR');
}

function shouldScanQrWithJsQR(formatsToSupport?: CodeFormatsToSupport) {
  const formats = formatsToSupport?.length ? formatsToSupport : DEFAULT_CODE_FORMATS;
  return formats.includes(Html5QrcodeSupportedFormats.QR_CODE);
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
            return clampCodeScanBoxSize(scanBoxSize ?? getCodeScanBoxSize(width, height), width, height);
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
      if (isSafariBrowser() && shouldScanQrWithJsQR(formatsToSupport)) {
        try {
          const decodedText = await scanFileWithJsQR(file, formatsToSupport);
          onScanSuccess(decodedText);
          return;
        } catch {
          // Fall through to html5-qrcode so barcode uploads still work in Safari.
        }
      }

      if (!scanner) {
        return;
      }

      await stopScanner(scanner);
      try {
        const result = await scanner.scanFileV2(file, false);
        onScanSuccess(result.decodedText);
      } catch {
        onScanFailure?.();
        await startScanCamera(scanner);
      }
    },
    [formatsToSupport, onScanFailure, onScanSuccess, scanner, startScanCamera],
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
    startScanCamera(scannerInstance).catch((error: unknown) => {
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
