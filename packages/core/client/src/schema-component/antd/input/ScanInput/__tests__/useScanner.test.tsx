/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getQRCodeScanBoxSize, getVisibleQRCodeScanBoxSize } from '../useScanner';

describe('ScanInput useScanner', () => {
  it('uses the visible scan box as the camera scan region', () => {
    const scanBoxSize = getVisibleQRCodeScanBoxSize(390, 844);

    expect(scanBoxSize).toEqual({ width: 234, height: 234 });
    expect(getQRCodeScanBoxSize(scanBoxSize, 320, 240)).toEqual({ width: 234, height: 234 });
  });

  it('does not return a qrbox larger than the camera viewfinder', () => {
    expect(getQRCodeScanBoxSize({ width: 360, height: 360 }, 320, 240)).toEqual({ width: 320, height: 240 });
  });
});
