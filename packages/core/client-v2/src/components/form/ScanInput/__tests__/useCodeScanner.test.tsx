/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React, { useCallback } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CODE_FORMATS, getCodeScanBoxSize, useCodeScanner } from '../useCodeScanner';

type MockScannerInstance = {
  clear: ReturnType<typeof vi.fn>;
  getState: ReturnType<typeof vi.fn>;
  scanFileV2: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => {
  const start = vi.fn().mockResolvedValue(null);
  const stop = vi.fn().mockResolvedValue(null);
  const clear = vi.fn();
  const getState = vi.fn(() => 1);
  const scanFileV2 = vi.fn();
  const Html5Qrcode = vi.fn(function MockHtml5Qrcode(this: MockScannerInstance) {
    this.start = start;
    this.stop = stop;
    this.clear = clear;
    this.getState = getState;
    this.scanFileV2 = scanFileV2;
  });

  return {
    clear,
    getState,
    Html5Qrcode,
    scanFileV2,
    start,
    stop,
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

function ScannerHost({
  onCameraStartFailure,
  scanBoxSize,
}: { onCameraStartFailure?: (error: unknown) => void; scanBoxSize?: { width: number; height: number } } = {}) {
  const handleScanSuccess = useCallback(() => undefined, []);

  useCodeScanner({
    elementId: 'scanner',
    enabled: true,
    scanBoxSize,
    onCameraStartFailure,
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

describe('useCodeScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    expect(config?.qrbox?.(390, 844)).toEqual({ width: 319, height: 240 });
    expect(getCodeScanBoxSize(390, 844)).toEqual({ width: 319, height: 240 });
  });

  it('can use the visible viewport scan box when the camera video is wider than the viewport', async () => {
    render(<ScannerHost scanBoxSize={{ width: 319, height: 240 }} />);

    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    const config = mocks.start.mock.calls[0]?.[1] as
      | { qrbox?: (width: number, height: number) => { width: number; height: number } }
      | undefined;

    expect(config?.qrbox?.(1200, 844)).toEqual({ width: 319, height: 240 });
  });

  it('does not return a qrbox larger than the camera viewfinder', async () => {
    render(<ScannerHost scanBoxSize={{ width: 520, height: 240 }} />);

    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    const config = mocks.start.mock.calls[0]?.[1] as
      | { qrbox?: (width: number, height: number) => { width: number; height: number } }
      | undefined;

    expect(config?.qrbox?.(320, 180)).toEqual({ width: 320, height: 180 });
  });

  it('reports camera start failures separately from decode failures', async () => {
    const handleCameraStartFailure = vi.fn();
    const error = new Error('camera busy');
    mocks.start.mockRejectedValueOnce(error);

    render(<ScannerHost onCameraStartFailure={handleCameraStartFailure} />);

    await waitFor(() => expect(handleCameraStartFailure).toHaveBeenCalledWith(error));
  });

  it('retries file scanning with an enhanced image when the original upload is not decoded', async () => {
    const handleScanSuccess = vi.fn();
    const originalError = new Error('not found');
    mocks.scanFileV2.mockRejectedValueOnce(originalError).mockResolvedValueOnce({ decodedText: 'ENHANCED-CODE' });

    vi.stubGlobal(
      'Image',
      class MockImage {
        onabort: ((event: Event) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onload: (() => void) | null = null;
        height = 400;
        naturalHeight = 400;
        naturalWidth = 600;
        width = 600;

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

    const canvasContext = {
      canvas: { height: 0, width: 0 },
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([80, 80, 80, 255]),
      })),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
      callback(new Blob(['enhanced'], { type: 'image/png' }));
    });

    render(<FileScannerHost onScanSuccess={handleScanSuccess} />);
    await waitFor(() => expect(mocks.start).toHaveBeenCalled());

    fireEvent.click(screen.getByText('scan file'));

    await waitFor(() => expect(handleScanSuccess).toHaveBeenCalledWith('ENHANCED-CODE'));
    expect(mocks.scanFileV2).toHaveBeenCalledTimes(2);
    expect(mocks.scanFileV2.mock.calls[1]?.[0]).toBeInstanceOf(File);
  });
});
