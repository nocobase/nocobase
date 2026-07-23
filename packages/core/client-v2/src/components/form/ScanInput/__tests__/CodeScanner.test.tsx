/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CodeScanner } from '../CodeScanner';

const mocks = vi.hoisted(() => ({
  getCameras: vi.fn().mockResolvedValue([{ id: 'rear-camera' }]),
}));

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: {
    getCameras: mocks.getCameras,
  },
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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../useCodeScanner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../useCodeScanner')>();
  const ReactModule = await import('react');

  return {
    ...actual,
    useCodeScanner: ({
      enabled,
      onScannerSizeChanged,
    }: {
      enabled: boolean;
      onScannerSizeChanged?: (size: { width: number; height: number }) => void;
    }) => {
      ReactModule.useEffect(() => {
        if (enabled) {
          onScannerSizeChanged?.({ width: 1280, height: 720 });
        }
      }, [enabled, onScannerSizeChanged]);

      return { startScanFile: vi.fn() };
    },
  };
});

describe('CodeScanner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the camera preview covering portrait and landscape viewports', async () => {
    let viewportWidth = 390;
    let viewportHeight = 844;
    vi.spyOn(window, 'innerWidth', 'get').mockImplementation(() => viewportWidth);
    vi.spyOn(window, 'innerHeight', 'get').mockImplementation(() => viewportHeight);

    render(<CodeScanner visible onClose={() => undefined} onScanSuccess={() => undefined} />);

    await waitFor(() => expect(document.getElementById('code-scan-box')).toBeInTheDocument());

    const scannerElement = document.querySelector<HTMLElement>('[id^="code-scanner-"]');
    const scannerSurface = scannerElement?.parentElement;
    const scanBox = document.getElementById('code-scan-box');
    expect(scannerSurface?.style.transform).toBe(`translate(-50%, -50%) scale(${844 / 720})`);
    expect(scanBox).toHaveStyle({ width: '351px', height: '540px' });

    viewportWidth = 844;
    viewportHeight = 390;
    act(() => window.dispatchEvent(new Event('resize')));

    await waitFor(() => {
      expect(scannerSurface?.style.transform).toBe(`translate(-50%, -50%) scale(${844 / 1280})`);
      expect(scanBox).toHaveStyle({ width: '759px', height: '273px' });
    });
  });
});
