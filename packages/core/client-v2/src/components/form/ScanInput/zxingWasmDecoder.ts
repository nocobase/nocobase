/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

let decoderPromise: Promise<typeof import('zxing-wasm/reader')> | undefined;

async function loadDecoder() {
  if (!decoderPromise) {
    decoderPromise = Promise.all([import('zxing-wasm/reader'), import('zxing-wasm/reader/zxing_reader.wasm')])
      .then(async ([decoder, { default: wasmUrl }]) => {
        try {
          await decoder.prepareZXingModule({
            fireImmediately: true,
            overrides: { locateFile: () => wasmUrl },
          });
        } catch (error) {
          decoder.purgeZXingModule();
          throw error;
        }
        return decoder;
      })
      .catch((error: unknown) => {
        decoderPromise = undefined;
        throw error;
      });
  }
  return decoderPromise;
}

export async function decodeQrCodeWithZxingWasm(imageData: ImageData) {
  const decoder = await loadDecoder();
  const results = await decoder.readBarcodes(imageData, {
    binarizer: 'GlobalHistogram',
    downscaleThreshold: 300,
    formats: ['QRCode'],
    maxNumberOfSymbols: 1,
    tryDenoise: true,
    tryDownscale: true,
    tryHarder: true,
    tryInvert: true,
    tryRotate: true,
  });
  if (results[0]?.text) {
    return results[0].text;
  }

  const fallbackResults = await decoder.readBarcodes(imageData, {
    binarizer: 'LocalAverage',
    downscaleThreshold: 300,
    formats: ['QRCode'],
    maxNumberOfSymbols: 1,
    tryDenoise: true,
    tryDownscale: true,
    tryHarder: true,
    tryInvert: true,
    tryRotate: true,
  });
  return fallbackResults[0]?.text;
}
