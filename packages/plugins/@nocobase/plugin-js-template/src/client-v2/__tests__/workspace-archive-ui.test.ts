/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createJsTemplateWorkspaceArchive,
  readJsTemplateWorkspaceArchive,
} from '../workspace/jsTemplateWorkspaceArchive';

describe('workspace archive UI', () => {
  it('exports only the supplied unsaved working-copy scope without mutating it', async () => {
    const files = Object.freeze([
      { path: 'src/shared/value.ts', content: 'export const value = 2;\n' },
      { path: 'src/client/js-blocks/example/index.tsx', content: 'ctx.render(<div>Draft</div>);\n' },
      {
        path: 'src/client/js-blocks/orders/index.tsx',
        content: 'ctx.render(<div>{String(ctx.record?.id ?? "")}</div>);\n',
      },
    ]);
    await expect(createJsTemplateWorkspaceArchive(files)).resolves.toBeInstanceOf(Blob);
    expect(files.map((file) => file.path)).toEqual([
      'src/shared/value.ts',
      'src/client/js-blocks/example/index.tsx',
      'src/client/js-blocks/orders/index.tsx',
    ]);
  });

  it('reads an import and keeps file-reader failures visible to the caller', async () => {
    const archive = new Blob(['archive bytes']);

    await expect(readJsTemplateWorkspaceArchive(archive, 'Import failed')).resolves.toBe(
      Buffer.from('archive bytes').toString('base64'),
    );

    const originalReader = globalThis.FileReader;
    class FailingFileReader {
      error = new Error('reader failed');
      onerror: (() => void) | null = null;

      readAsDataURL() {
        this.onerror?.();
      }
    }
    globalThis.FileReader = FailingFileReader as unknown as typeof FileReader;
    try {
      await expect(readJsTemplateWorkspaceArchive(archive, 'Import failed')).rejects.toThrow('Import failed');
    } finally {
      globalThis.FileReader = originalReader;
    }
  });
});
