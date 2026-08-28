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
import { DEFAULT_CODE_FORMATS, getCodeScanBoxSize, scanQrVideoFrame, useCodeScanner } from '../useCodeScanner';

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

function stubCanvas() {
  const canvasContext = {
    drawImage: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      height,
      width,
    })),
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext);
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

  it('decodes a centered QR code from the raw camera frame fast path', () => {
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
