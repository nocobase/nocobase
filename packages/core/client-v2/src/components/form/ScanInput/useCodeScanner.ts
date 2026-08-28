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
import { useCallback, useEffect, useRef, useState } from 'react';
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

type FocusMediaTrackCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
};

type FocusMediaTrackConstraintSet = MediaTrackConstraintSet & {
  focusMode?: string;
};

const QR_SCAN_IMAGE_SIZES = [3200, 2400, 1600, 1000];
const LIVE_QR_SCAN_INTERVAL = 120;
const LIVE_QR_SCAN_MAX_WIDTH = 960;
const LIVE_QR_SCAN_MAX_HEIGHT = 540;
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
    width: Math.floor(Math.min((width * 90) / 100, 1152)),
    height: Math.floor(Math.min((height * 70) / 100, 540)),
  };
}

export function scanQrVideoFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  if (!video.videoWidth || !video.videoHeight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return;
  }

  const viewfinderWidth = video.clientWidth || video.videoWidth;
  const viewfinderHeight = video.clientHeight || video.videoHeight;
  const scanBoxSize = getCodeScanBoxSize(viewfinderWidth, viewfinderHeight);
  const sourceWidth = Math.min(video.videoWidth, Math.floor(scanBoxSize.width * (video.videoWidth / viewfinderWidth)));
  const sourceHeight = Math.min(
    video.videoHeight,
    Math.floor(scanBoxSize.height * (video.videoHeight / viewfinderHeight)),
  );
  const sourceX = Math.floor((video.videoWidth - sourceWidth) / 2);
  const sourceY = Math.floor((video.videoHeight - sourceHeight) / 2);
  const targetScale = Math.min(1, LIVE_QR_SCAN_MAX_WIDTH / sourceWidth, LIVE_QR_SCAN_MAX_HEIGHT / sourceHeight);
  const targetWidth = Math.max(1, Math.floor(sourceWidth * targetScale));
  const targetHeight = Math.max(1, Math.floor(sourceHeight * targetScale));
  if (canvas.width !== targetWidth) {
    canvas.width = targetWidth;
  }
  if (canvas.height !== targetHeight) {
    canvas.height = targetHeight;
  }
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return;
  }

  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
  const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
  return jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' })?.data;
}

function startLiveQrScan(elementId: string, onScanSuccess: (text: string) => void) {
  const canvas = document.createElement('canvas');
  let timer: number | undefined;
  let stopped = false;

  const scan = () => {
    if (stopped) {
      return;
    }
    const video = document.getElementById(elementId)?.querySelector('video');
    if (video) {
      const decodedText = scanQrVideoFrame(video, canvas);
      if (decodedText) {
        stopped = true;
        onScanSuccess(decodedText);
        return;
      }
    }
    timer = window.setTimeout(scan, LIVE_QR_SCAN_INTERVAL);
  };

  timer = window.setTimeout(scan, 0);
  return () => {
    stopped = true;
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
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

async function enableContinuousFocus(scanner: Html5Qrcode) {
  try {
    const capabilities = scanner.getRunningTrackCapabilities() as FocusMediaTrackCapabilities;
    if (!capabilities.focusMode?.includes('continuous')) {
      return;
    }
    const focusConstraints: FocusMediaTrackConstraintSet = { focusMode: 'continuous' };
    await scanner.applyVideoConstraints({ advanced: [focusConstraints] });
  } catch {
    // Some browsers expose incomplete camera capability APIs. Scanning should continue without explicit focus control.
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
  onScannerSizeChanged,
  onScanSuccess,
  onScanFailure,
  onCameraStartFailure,
}: UseCodeScannerOptions) {
  const [scanner, setScanner] = useState<Html5Qrcode>();
  const liveQrScanStopRef = useRef<() => void>();
  const scanSucceededRef = useRef(false);
  const scanSessionRef = useRef(0);

  const stopLiveQrScan = useCallback(() => {
    liveQrScanStopRef.current?.();
    liveQrScanStopRef.current = undefined;
  }, []);

  const cancelActiveScan = useCallback(() => {
    scanSessionRef.current += 1;
    stopLiveQrScan();
  }, [stopLiveQrScan]);

  const reportScanSuccess = useCallback(
    (text: string) => {
      if (scanSucceededRef.current) {
        return;
      }
      scanSucceededRef.current = true;
      stopLiveQrScan();
      onScanSuccess(text);
    },
    [onScanSuccess, stopLiveQrScan],
  );

  const startScanCamera = useCallback(
    async (scannerInstance: Html5Qrcode) => {
      cancelActiveScan();
      const scanSession = scanSessionRef.current;
      scanSucceededRef.current = false;
      try {
        await scannerInstance.start(
          { facingMode: 'environment' },
          {
            fps: 8,
            disableFlip: false,
            videoConstraints: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
            },
            qrbox(width, height) {
              onScannerSizeChanged?.({ width, height });
              return clampCodeScanBoxSize(getCodeScanBoxSize(width, height), width, height);
            },
          },
          (decodedText) => {
            reportScanSuccess(decodedText);
          },
          undefined,
        );
      } catch (error) {
        if (scanSession !== scanSessionRef.current) {
          return;
        }
        throw error;
      }
      if (scanSession !== scanSessionRef.current) {
        try {
          await stopScanner(scannerInstance, { clear: true });
        } catch {
          // The scanner may already have been cleared by the canceled session cleanup.
        }
        return;
      }
      if (shouldScanQrWithJsQR(formatsToSupport)) {
        liveQrScanStopRef.current = startLiveQrScan(elementId, reportScanSuccess);
      }
      await enableContinuousFocus(scannerInstance);
    },
    [cancelActiveScan, elementId, formatsToSupport, onScannerSizeChanged, reportScanSuccess],
  );

  const startScanFile = useCallback(
    async (file: File) => {
      cancelActiveScan();
      scanSucceededRef.current = false;
      if (isSafariBrowser() && shouldScanQrWithJsQR(formatsToSupport)) {
        try {
          const decodedText = await scanFileWithJsQR(file, formatsToSupport);
          reportScanSuccess(decodedText);
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
        reportScanSuccess(result.decodedText);
      } catch {
        onScanFailure?.();
        await startScanCamera(scanner);
      }
    },
    [cancelActiveScan, formatsToSupport, onScanFailure, reportScanSuccess, scanner, startScanCamera],
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
      cancelActiveScan();
      stopScanner(scannerInstance, { clear: true }).catch(() => undefined);
    };
  }, [cancelActiveScan, elementId, enabled, formatsToSupport, onCameraStartFailure, onScanFailure, startScanCamera]);

  return {
    startScanFile,
  };
}
