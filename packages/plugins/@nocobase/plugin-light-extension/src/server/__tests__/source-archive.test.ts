/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import JSZip from 'jszip';

import { parseLightExtensionSourceArchive } from '../services/LightExtensionSourceArchive';
import { LightExtensionValidator } from '../services/LightExtensionValidator';

describe('plugin-light-extension source ZIP archive', () => {
  it('reads a normal source ZIP', async () => {
    const zipBase64 = await createZipBase64({
      'README.md': '# Imported\n',
      'src/shared/title.ts': 'export const title = "Orders";\n',
      'src/client/js-blocks/example/entry.json': '{"schemaVersion":1,"key":"example"}\n',
      'src/client/js-blocks/example/index.jsx': 'ctx.render(<div>Imported</div>);\n',
      'src/client/js-pages/orders/entry.json': '{"schemaVersion":1,"key":"orders"}\n',
      'src/client/js-pages/orders/index.tsx':
        'import { title } from "../../../shared/title";\nctx.render(<div>{title}</div>);\n',
    });

    const files = await parseLightExtensionSourceArchive(zipBase64, new LightExtensionValidator());

    expect(files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'README.md', content: '# Imported\n' }),
        expect.objectContaining({ path: 'src/client/js-blocks/example/entry.json' }),
        expect.objectContaining({ path: 'src/client/js-pages/orders/entry.json' }),
        expect.objectContaining({
          path: 'src/client/js-blocks/example/index.jsx',
          content: 'ctx.render(<div>Imported</div>);\n',
        }),
        expect.objectContaining({
          path: 'src/client/js-pages/orders/index.tsx',
          content: 'import { title } from "../../../shared/title";\nctx.render(<div>{title}</div>);\n',
        }),
        expect.objectContaining({ path: 'src/shared/title.ts' }),
      ]),
    );
  });

  it('strips one shared top-level directory and ignores macOS metadata', async () => {
    const zipBase64 = await createZipBase64({
      'example-source/README.md': '# Wrapped\n',
      'example-source/src/client/js-pages/example/entry.json': '{"schemaVersion":1,"key":"example"}\n',
      'example-source/src/client/js-pages/example/index.js': 'ctx.render(ctx.page.uid);\n',
      'example-source/.DS_Store': 'metadata',
      '__MACOSX/example-source/._README.md': 'metadata',
    });

    const files = await parseLightExtensionSourceArchive(zipBase64, new LightExtensionValidator());

    expect(files.map((file) => file.path)).toEqual([
      'README.md',
      'src/client/js-pages/example/entry.json',
      'src/client/js-pages/example/index.js',
    ]);
  });

  it('rejects non-UTF-8 source files', async () => {
    const zipBase64 = await createZipBase64({
      'src/shared/binary.bin': Buffer.from([0, 255, 1]),
    });

    await expect(parseLightExtensionSourceArchive(zipBase64, new LightExtensionValidator())).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'zip_file_not_utf8' })]),
      },
    });
  });

  it('rejects path traversal and case-insensitive duplicate paths', async () => {
    const traversalZip = await createZipBase64({
      '../escape.js': 'export default true;\n',
    });
    const duplicateZip = await createZipBase64({
      'README.md': '# One\n',
      'readme.md': '# Two\n',
    });

    await expect(parseLightExtensionSourceArchive(traversalZip, new LightExtensionValidator())).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'zip_path_invalid' })]),
      },
    });
    await expect(parseLightExtensionSourceArchive(duplicateZip, new LightExtensionValidator())).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'zip_duplicate_path' })]),
      },
    });
  });

  it('rejects compressed, uncompressed, and per-file budget overruns before accepting source', async () => {
    const zipBase64 = await createZipBase64({
      'src/client/js-blocks/example/index.js': `export default ${JSON.stringify('a'.repeat(1024))};\n`,
    });

    await expect(
      parseLightExtensionSourceArchive(
        zipBase64,
        new LightExtensionValidator({ limits: { maxZipCompressionRatio: 1 } }),
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'zip_compression_ratio_too_high' })]),
      },
    });

    await expect(
      parseLightExtensionSourceArchive(zipBase64, new LightExtensionValidator({ limits: { maxFileBytes: 16 } })),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'file_size_limit_exceeded' })]),
      },
    });

    await expect(
      parseLightExtensionSourceArchive(zipBase64, new LightExtensionValidator({ limits: { maxZipBytes: 16 } })),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'zip_too_large' })]),
      },
    });
  });
});

async function createZipBase64(files: Record<string, string | Buffer>): Promise<string> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }

  return zip.generateAsync({
    type: 'base64',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}
