/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, it, vi } from 'vitest';
import { decodeQrCodeWithZxingWasm } from '../zxingWasmDecoder';

const mocks = vi.hoisted(() => ({
  prepareZXingModule: vi.fn(),
  purgeZXingModule: vi.fn(),
  readBarcodes: vi.fn(),
}));

vi.mock('zxing-wasm/reader', () => mocks);
vi.mock('zxing-wasm/reader/zxing_reader.wasm', () => ({ default: '/assets/zxing_reader.wasm' }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.prepareZXingModule.mockResolvedValue(undefined);
  mocks.readBarcodes.mockResolvedValue([]);
});

it('retries decoder loading and uses the strategy proven against customer frames', async () => {
  const imageData = { data: new Uint8ClampedArray(16), height: 2, width: 2 } as ImageData;
  mocks.prepareZXingModule.mockRejectedValueOnce(new Error('decoder loading failed'));

  await expect(decodeQrCodeWithZxingWasm(imageData)).rejects.toThrow('decoder loading failed');
  expect(mocks.purgeZXingModule).toHaveBeenCalledTimes(1);

  mocks.readBarcodes.mockResolvedValueOnce([{ text: 'CUSTOMER-QR' }]);

  await expect(decodeQrCodeWithZxingWasm(imageData)).resolves.toBe('CUSTOMER-QR');
  expect(mocks.prepareZXingModule).toHaveBeenCalledTimes(2);
  const { overrides } = mocks.prepareZXingModule.mock.calls[1][0] as {
    overrides: { locateFile: () => string };
  };
  const { locateFile } = overrides;
  expect(locateFile()).toBe('/assets/zxing_reader.wasm');
  expect(mocks.prepareZXingModule).toHaveBeenLastCalledWith({
    fireImmediately: true,
    overrides: { locateFile: expect.any(Function) },
  });
  expect(mocks.readBarcodes).toHaveBeenCalledWith(imageData, {
    binarizer: 'GlobalHistogram',
    formats: ['QRCode'],
    maxNumberOfSymbols: 1,
    tryDenoise: true,
    tryDownscale: false,
    tryHarder: true,
    tryInvert: true,
    tryRotate: true,
  });
});
