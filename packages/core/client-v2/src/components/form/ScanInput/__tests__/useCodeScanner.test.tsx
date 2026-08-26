/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@testing-library/react';
import React, { useCallback } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

function ScannerHost({ scanBoxSize }: { scanBoxSize?: { width: number; height: number } } = {}) {
  const handleScanSuccess = useCallback(() => undefined, []);

  useCodeScanner({
    elementId: 'scanner',
    enabled: true,
    scanBoxSize,
    onScanSuccess: handleScanSuccess,
  });

  return <div id="scanner" />;
}

describe('useCodeScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
