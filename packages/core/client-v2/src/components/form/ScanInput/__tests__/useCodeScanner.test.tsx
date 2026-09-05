/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useCallback } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_CODE_FORMATS,
  getCodeScanBoxSize,
  isIOSBrowser,
  scanQrVideoFrame,
  useCodeScanner,
} from '../useCodeScanner';

type MockScannerInstance = {
  applyVideoConstraints: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  getRunningTrackCapabilities: ReturnType<typeof vi.fn>;
  getState: ReturnType<typeof vi.fn>;
  scanFileV2: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => {
  const start = vi.fn().mockResolvedValue(null);
  const stop = vi.fn().mockResolvedValue(null);
  const clear = vi.fn();
  const applyVideoConstraints = vi.fn().mockResolvedValue(undefined);
  const getRunningTrackCapabilities = vi.fn(() => ({}));
  const getState = vi.fn(() => 1);
  const scanFileV2 = vi.fn();
  const Html5Qrcode = vi.fn(function MockHtml5Qrcode(this: MockScannerInstance) {
    this.start = start;
    this.stop = stop;
    this.clear = clear;
    this.applyVideoConstraints = applyVideoConstraints;
    this.getRunningTrackCapabilities = getRunningTrackCapabilities;
    this.getState = getState;
    this.scanFileV2 = scanFileV2;
  });

  return {
    applyVideoConstraints,
    clear,
    getRunningTrackCapabilities,
    getState,
    Html5Qrcode,
    scanFileV2,
    start,
    stop,
  };
});

const jsQrMocks = vi.hoisted(() => {
  return {
    default: vi.fn(),
  };
});

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: mocks.Html5Qrcode,
  Html5QrcodeScannerState: {
    PAUSED: 3,
    SCANNING: 2,
  },
  Html5QrcodeSupportedFormats: {
    CODABAR: 2,
    CODE_128: 5,
    CODE_39: 3,
    CODE_93: 4,
    DATA_MATRIX: 6,
    EAN_13: 9,
    EAN_8: 10,
    ITF: 8,
    PDF_417: 11,
    QR_CODE: 0,
    UPC_A: 14,
    UPC_E: 15,
  },
}));

vi.mock('jsqr', () => jsQrMocks);

function ScannerHost({
  onCameraStartFailure,
  onScanFailure,
}: {
  onCameraStartFailure?: (error: unknown) => void;
  onScanFailure?: () => void;
} = {}) {
  const handleScanSuccess = useCallback(() => undefined, []);

  useCodeScanner({
    elementId: 'scanner',
    enabled: true,
    onCameraStartFailure,
    onScanFailure,
    onScanSuccess: handleScanSuccess,
  });

  return <div id="scanner" />;
}

function FileScannerHost({ onScanSuccess }: { onScanSuccess: (text: string) => void }) {
  const { startScanFile } = useCodeScanner({
    elementId: 'scanner',
    enabled: true,
    onScanSuccess,
  });

  return (
    <>
      <div id="scanner" />
      <button onClick={() => startScanFile(new File(['qr'], 'qr.png', { type: 'image/png' }))}>scan file</button>
    </>
  );
}

function stubSafariBrowser() {
  vi.spyOn(window.navigator, 'vendor', 'get').mockReturnValue('Apple Computer, Inc.');
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  );
}

function stubImageElement(size: { width: number; height: number } = { width: 600, height: 400 }) {
  vi.stubGlobal(
    'Image',
    class MockImage {
      onabort: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onload: (() => void) | null = null;
      height = size.height;
      naturalHeight = size.height;
      naturalWidth = size.width;
      width = size.width;

      set src(_value: string) {
        this.onload?.();
      }
    },
  );
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:qr'),
    revokeObjectURL: vi.fn(),
  });
}

function stubCanvas(imageData?: ImageData) {
  const canvasContext = {
    drawImage: vi.fn(),
    getImageData: vi.fn(
      (_x: number, _y: number, width: number, height: number) =>
        imageData || {
          data: new Uint8ClampedArray(width * height * 4),
          height,
          width,
        },
    ),
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext);
}

function createCustomerQrFrame(width: number, height: number) {
  const modules = [
    '111111101101001111111',
    '100000100101101000001',
    '101110100111101011101',
    '101110100111101011101',
    '101110101100101011101',
    '100000101000101000001',
    '111111101010101111111',
    '000000000111100000000',
    '011111110001100110001',
    '011010001101101111110',
    '101101110010011000110',
    '011000001011010110101',
    '011110111011000100100',
    '000000001100100001010',
    '111111101001100101110',
    '100000101001100001101',
    '101110101010000101110',
    '101110101011111001000',
    '101110101110101011000',
    '100000101101111010001',
    '111111100110100010000',
  ];
  const data = new Uint8ClampedArray(width * height * 4);
  data.fill(255);
  const moduleSize = 12;
  const left = Math.floor((width - modules.length * moduleSize) / 2);
  const top = 60;

  modules.forEach((row, rowIndex) => {
    Array.from(row).forEach((module, columnIndex) => {
      if (module !== '1') {
        return;
      }
      for (let y = 0; y < moduleSize; y += 1) {
        for (let x = 0; x < moduleSize; x += 1) {
          const pixelIndex = ((top + rowIndex * moduleSize + y) * width + left + columnIndex * moduleSize + x) * 4;
          data[pixelIndex] = 0;
          data[pixelIndex + 1] = 0;
          data[pixelIndex + 2] = 0;
        }
      }
    });
  });

  return { data, height, width } as ImageData;
}

describe('useCodeScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.applyVideoConstraints.mockResolvedValue(undefined);
    mocks.getRunningTrackCapabilities.mockReturnValue({});
    mocks.start.mockResolvedValue(null);
    mocks.stop.mockResolvedValue(null);
    mocks.getState.mockReturnValue(1);
    jsQrMocks.default.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('starts scanning with QR code and barcode formats by default', async () => {
    render(<ScannerHost />);

    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    expect(mocks.Html5Qrcode).toHaveBeenCalledWith('scanner', {
      formatsToSupport: DEFAULT_CODE_FORMATS,
      verbose: false,
    });
    expect(DEFAULT_CODE_FORMATS).toEqual(expect.arrayContaining([0, 5, 9, 14]));
  });

  it('uses the visible scan box as the camera scan region', async () => {
    render(<ScannerHost />);

    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    const config = mocks.start.mock.calls[0]?.[1] as
      | { qrbox?: (width: number, height: number) => { width: number; height: number } }
      | undefined;

    expect(config?.qrbox?.(1280, 720)).toEqual({ width: 1152, height: 504 });
    expect(getCodeScanBoxSize(1280, 720)).toEqual({ width: 1152, height: 504 });
  });

  it('uses optimized camera constraints without requiring a user-selected scan mode', async () => {
    render(<ScannerHost />);

    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    const config = mocks.start.mock.calls[0]?.[1] as
      | {
          disableFlip?: boolean;
          fps?: number;
          qrbox?: (width: number, height: number) => { width: number; height: number };
          videoConstraints?: MediaTrackConstraints;
        }
      | undefined;

    expect(config?.qrbox?.(1280, 720)).toEqual({ width: 1152, height: 504 });
    expect(config).toMatchObject({
      disableFlip: false,
      fps: 8,
      videoConstraints: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
    });
    expect(mocks.Html5Qrcode).toHaveBeenCalledWith('scanner', {
      formatsToSupport: DEFAULT_CODE_FORMATS,
      verbose: false,
    });
  });

  it('keeps the existing centered scan region outside iOS', () => {
    jsQrMocks.default.mockReturnValueOnce({ data: 'FAST-QR' });
    stubCanvas();
    const video = document.createElement('video');
    Object.defineProperties(video, {
      clientHeight: { value: 720 },
      clientWidth: { value: 1280 },
      readyState: { value: HTMLMediaElement.HAVE_CURRENT_DATA },
      videoHeight: { value: 1080 },
      videoWidth: { value: 1920 },
    });
    const canvas = document.createElement('canvas');

    expect(scanQrVideoFrame(video, canvas)).toBe('FAST-QR');

    const context = canvas.getContext('2d');
    expect(context?.drawImage).toHaveBeenCalledWith(video, 96, 162, 1728, 756, 0, 0, 960, 420);
    expect(jsQrMocks.default).toHaveBeenCalledWith(expect.any(Uint8ClampedArray), 960, 420, {
      inversionAttempts: 'dontInvert',
    });
  });

  it('decodes the camera preview visible on iOS without scanning offscreen content', async () => {
    const actualJsQr = await vi.importActual<typeof import('jsqr')>('jsqr');
    jsQrMocks.default.mockImplementationOnce(actualJsQr.default);
    stubCanvas(createCustomerQrFrame(431, 933));
    const video = document.createElement('video');
    Object.defineProperties(video, {
      getBoundingClientRect: {
        value: () => ({ bottom: 864, height: 864, left: -573, right: 963, top: 0, width: 1536 }),
      },
      readyState: { value: HTMLMediaElement.HAVE_CURRENT_DATA },
      videoHeight: { value: 1080 },
      videoWidth: { value: 1920 },
    });
    const scanViewport = document.createElement('div');
    vi.spyOn(scanViewport, 'getBoundingClientRect').mockReturnValue({
      bottom: 844,
      height: 844,
      left: 0,
      right: 390,
      top: 0,
      width: 390,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    });
    const canvas = document.createElement('canvas');

    expect(scanQrVideoFrame(video, canvas, scanViewport)).toBe('TCBNVBY064J3');

    const context = canvas.getContext('2d');
    expect(context?.drawImage).toHaveBeenCalledWith(video, 716, 0, 488, 1055, 0, 0, 431, 933);
    expect(jsQrMocks.default).toHaveBeenCalledWith(expect.any(Uint8ClampedArray), 431, 933, {
      inversionAttempts: 'dontInvert',
    });
  });

  it('detects iPhone browsers', () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)');
    expect(isIOSBrowser()).toBe(true);
  });

  it('detects iPad browsers using desktop mode', () => {
    vi.stubGlobal('navigator', {
      maxTouchPoints: 5,
      platform: 'MacIntel',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
    });
    expect(isIOSBrowser()).toBe(true);
  });

  it('keeps the iOS preview path disabled on other platforms', () => {
    vi.stubGlobal('navigator', {
      maxTouchPoints: 0,
      platform: 'Linux x86_64',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    });
    expect(isIOSBrowser()).toBe(false);
  });

  it('waits for a measurable iOS preview instead of scanning hidden camera content', () => {
    stubCanvas();
    const video = document.createElement('video');
    Object.defineProperties(video, {
      readyState: { value: HTMLMediaElement.HAVE_CURRENT_DATA },
      videoHeight: { value: 1080 },
      videoWidth: { value: 1920 },
    });
    const canvas = document.createElement('canvas');
    const scanViewport = document.createElement('div');

    expect(scanQrVideoFrame(video, canvas, scanViewport)).toBeUndefined();
    expect(jsQrMocks.default).not.toHaveBeenCalled();
  });

  it('enables continuous camera focus when the device supports it', async () => {
    mocks.getRunningTrackCapabilities.mockReturnValue({ focusMode: ['manual', 'continuous'] });

    render(<ScannerHost />);

    await waitFor(() =>
      expect(mocks.applyVideoConstraints).toHaveBeenCalledWith({
        advanced: [{ focusMode: 'continuous' }],
      }),
    );
  });

  it('reports camera start failures through the dedicated handler', async () => {
    const cameraStartError = Object.assign(new Error('Camera failed'), { name: 'NotAllowedError' });
    const handleCameraStartFailure = vi.fn();
    const handleScanFailure = vi.fn();
    mocks.start.mockRejectedValueOnce(cameraStartError);

    render(<ScannerHost onCameraStartFailure={handleCameraStartFailure} onScanFailure={handleScanFailure} />);

    await waitFor(() => expect(handleCameraStartFailure).toHaveBeenCalledWith(cameraStartError));
    expect(handleScanFailure).not.toHaveBeenCalled();
  });

  it('stops a camera that finishes starting after the scanner unmounts', async () => {
    let resolveStart: ((value: null) => void) | undefined;
    mocks.start.mockReturnValueOnce(
      new Promise<null>((resolve) => {
        resolveStart = resolve;
      }),
    );
    mocks.getState.mockReturnValueOnce(1).mockReturnValue(2);

    const { unmount } = render(<ScannerHost />);
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    unmount();
    await act(async () => {
      resolveStart?.(null);
    });

    await waitFor(() => expect(mocks.stop).toHaveBeenCalledTimes(1));
    expect(mocks.clear).toHaveBeenCalled();
  });

  it('ignores a camera start failure after the scanner unmounts', async () => {
    let rejectStart: ((error: Error) => void) | undefined;
    mocks.start.mockReturnValueOnce(
      new Promise<null>((_resolve, reject) => {
        rejectStart = reject;
      }),
    );
    const handleCameraStartFailure = vi.fn();
    const handleScanFailure = vi.fn();

    const { unmount } = render(
      <ScannerHost onCameraStartFailure={handleCameraStartFailure} onScanFailure={handleScanFailure} />,
    );
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    unmount();
    await act(async () => {
      rejectStart?.(new Error('Camera start canceled'));
    });

    expect(handleCameraStartFailure).not.toHaveBeenCalled();
    expect(handleScanFailure).not.toHaveBeenCalled();
  });

  it('uses jsQR first for Safari uploaded QR images', async () => {
    const handleScanSuccess = vi.fn();
    jsQrMocks.default.mockReturnValueOnce({ data: 'JSQR-CODE' });
    stubSafariBrowser();
    stubImageElement();
    stubCanvas();

    render(<FileScannerHost onScanSuccess={handleScanSuccess} />);
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    fireEvent.click(screen.getByText('scan file'));

    await waitFor(() => expect(handleScanSuccess).toHaveBeenCalledWith('JSQR-CODE'));
    expect(jsQrMocks.default).toHaveBeenCalledWith(expect.any(Uint8ClampedArray), 600, 400, {
      inversionAttempts: 'attemptBoth',
    });
    expect(mocks.scanFileV2).not.toHaveBeenCalled();
  });

  it('falls back to html5-qrcode for Safari uploaded files when jsQR does not decode a QR code', async () => {
    const handleScanSuccess = vi.fn();
    mocks.scanFileV2.mockResolvedValueOnce({ decodedText: 'BARCODE-CODE' });
    stubSafariBrowser();
    stubImageElement();
    stubCanvas();

    render(<FileScannerHost onScanSuccess={handleScanSuccess} />);
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    fireEvent.click(screen.getByText('scan file'));

    await waitFor(() => expect(handleScanSuccess).toHaveBeenCalledWith('BARCODE-CODE'));
    expect(jsQrMocks.default).toHaveBeenCalled();
    expect(mocks.scanFileV2).toHaveBeenCalled();
  });

  it('tries multiple image scales before falling back from Safari jsQR scanning', async () => {
    const handleScanSuccess = vi.fn();
    Array.from({ length: 8 }).forEach((_, index) => {
      jsQrMocks.default.mockReturnValueOnce(index === 7 ? { data: 'SCALED-CODE' } : undefined);
    });
    stubSafariBrowser();
    stubImageElement({ width: 4000, height: 3000 });
    stubCanvas();

    render(<FileScannerHost onScanSuccess={handleScanSuccess} />);
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    fireEvent.click(screen.getByText('scan file'));

    await waitFor(() => expect(handleScanSuccess).toHaveBeenCalledWith('SCALED-CODE'));
    expect(jsQrMocks.default).toHaveBeenCalledTimes(8);
  });

  it('tries enhanced grayscale QR images for blurry Safari uploads', async () => {
    const handleScanSuccess = vi.fn();
    jsQrMocks.default.mockReturnValueOnce(undefined).mockReturnValueOnce({ data: 'ENHANCED-CODE' });
    stubSafariBrowser();
    stubImageElement();
    stubCanvas();

    render(<FileScannerHost onScanSuccess={handleScanSuccess} />);
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    fireEvent.click(screen.getByText('scan file'));

    await waitFor(() => expect(handleScanSuccess).toHaveBeenCalledWith('ENHANCED-CODE'));
    expect(jsQrMocks.default).toHaveBeenCalledTimes(2);
  });
});
