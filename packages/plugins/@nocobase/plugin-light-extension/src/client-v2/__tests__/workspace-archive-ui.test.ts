/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import JSZip from 'jszip';

import {
  buildLightExtensionWorkspaceArchiveFileName,
  createLightExtensionWorkspaceArchive,
} from '../workspace/lightExtensionWorkspaceArchive';

describe('workspace archive UI', () => {
  it('exports only the supplied unsaved working-copy scope without mutating it', async () => {
    const files = Object.freeze([
      { path: 'src/shared/value.ts', content: 'export const value = 2;\n' },
      { path: 'src/client/js-blocks/example/index.tsx', content: 'ctx.render(<div>Draft</div>);\n' },
      { path: 'src/client/js-pages/orders/index.tsx', content: 'ctx.render(<div>{ctx.page.uid}</div>);\n' },
    ]);
    const blob = await createLightExtensionWorkspaceArchive(files);
    const zip = await JSZip.loadAsync(await readBlobAsArrayBuffer(blob));

    expect(Object.keys(zip.files)).toEqual([
      'src/',
      'src/client/',
      'src/client/js-blocks/',
      'src/client/js-blocks/example/',
      'src/client/js-blocks/example/index.tsx',
      'src/client/js-pages/',
      'src/client/js-pages/orders/',
      'src/client/js-pages/orders/index.tsx',
      'src/shared/',
      'src/shared/value.ts',
    ]);
    expect(files.map((file) => file.path)).toEqual([
      'src/shared/value.ts',
      'src/client/js-blocks/example/index.tsx',
      'src/client/js-pages/orders/index.tsx',
    ]);
    await expect(zip.file('src/shared/value.ts')?.async('string')).resolves.toBe('export const value = 2;\n');
    await expect(zip.file('src/client/js-blocks/example/index.tsx')?.async('string')).resolves.toBe(
      'ctx.render(<div>Draft</div>);\n',
    );
    await expect(zip.file('src/client/js-pages/orders/index.tsx')?.async('string')).resolves.toBe(
      'ctx.render(<div>{ctx.page.uid}</div>);\n',
    );
  });

  it('builds a filesystem-safe ZIP file name', () => {
    expect(buildLightExtensionWorkspaceArchiveFileName('Sales Widgets / 2026')).toBe('sales-widgets-2026.zip');
    expect(buildLightExtensionWorkspaceArchiveFileName(undefined)).toBe('light-extension.zip');
  });
});

function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
