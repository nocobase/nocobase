/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createJsTemplateWorkspaceArchive } from '../../client-v2/workspace/jsTemplateWorkspaceArchive';
import { parseJsTemplateSourceArchive } from '../services/JsTemplateSourceArchive';
import { JsTemplateValidator } from '../services/JsTemplateValidator';
import { createSymlinkZipBase64, createZipBase64 } from './security-test-fixtures';

describe('plugin-js-template source ZIP archive', () => {
  it('roundtrips exported files, entry descriptor, and dynamic settings through the source parser', async () => {
    const descriptor = '{"schemaVersion":1,"key":"orders","settings":{"region":{"type":"string","default":"APAC"}}}\n';
    const source = 'ctx.render(<div>{ctx.settings.region}</div>);\n';
    const archive = await createJsTemplateWorkspaceArchive([
      { path: 'README.md', content: '# Orders\n' },
      { path: 'src/client/js-blocks/orders/entry.json', content: descriptor },
      { path: 'src/client/js-blocks/orders/index.tsx', content: source },
    ]);

    const zipBase64 = Buffer.from(await archive.arrayBuffer()).toString('base64');
    const files = await parseJsTemplateSourceArchive(zipBase64, new JsTemplateValidator());

    expect(files).toEqual([
      { path: 'README.md', content: '# Orders\n', language: 'markdown', mode: '100644', size: 9 },
      {
        path: 'src/client/js-blocks/orders/entry.json',
        content: descriptor,
        language: 'json',
        mode: '100644',
        size: Buffer.byteLength(descriptor),
      },
      {
        path: 'src/client/js-blocks/orders/index.tsx',
        content: source,
        language: 'typescript',
        mode: '100644',
        size: Buffer.byteLength(source),
      },
    ]);
  });

  it('reads a normal source ZIP', async () => {
    const zipBase64 = await createZipBase64({
      'README.md': '# Imported\n',
      'src/shared/title.ts': 'export const title = "Orders";\n',
      'src/client/js-blocks/example/entry.json': '{"schemaVersion":1,"key":"example"}\n',
      'src/client/js-blocks/example/index.jsx': 'ctx.render(<div>Imported</div>);\n',
      'src/client/js-blocks/orders/entry.json':
        '{"schemaVersion":1,"key":"orders","settings":{"region":{"type":"string","default":"APAC"}}}\n',
      'src/client/js-blocks/orders/index.tsx':
        'import { title } from "../../../shared/title";\nctx.render(<div>{title}</div>);\n',
    });

    const files = await parseJsTemplateSourceArchive(zipBase64, new JsTemplateValidator());

    expect(files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'README.md', content: '# Imported\n' }),
        expect.objectContaining({ path: 'src/client/js-blocks/example/entry.json' }),
        expect.objectContaining({
          path: 'src/client/js-blocks/orders/entry.json',
          content: '{"schemaVersion":1,"key":"orders","settings":{"region":{"type":"string","default":"APAC"}}}\n',
        }),
        expect.objectContaining({
          path: 'src/client/js-blocks/example/index.jsx',
          content: 'ctx.render(<div>Imported</div>);\n',
        }),
        expect.objectContaining({
          path: 'src/client/js-blocks/orders/index.tsx',
          content: 'import { title } from "../../../shared/title";\nctx.render(<div>{title}</div>);\n',
        }),
        expect.objectContaining({ path: 'src/shared/title.ts' }),
      ]),
    );
  });

  it('strips one shared top-level directory and ignores macOS metadata', async () => {
    const zipBase64 = await createZipBase64({
      'example-source/README.md': '# Wrapped\n',
      'example-source/src/client/js-blocks/example/entry.json': '{"schemaVersion":1,"key":"example"}\n',
      'example-source/src/client/js-blocks/example/index.js': 'ctx.render(String(ctx.record?.id ?? ""));\n',
      'example-source/.DS_Store': 'metadata',
      '__MACOSX/example-source/._README.md': 'metadata',
    });

    const files = await parseJsTemplateSourceArchive(zipBase64, new JsTemplateValidator());

    expect(files.map((file) => file.path)).toEqual([
      'README.md',
      'src/client/js-blocks/example/entry.json',
      'src/client/js-blocks/example/index.js',
    ]);
  });

  it.each([
    ['path traversal', () => createZipBase64({ '../escape.js': 'export default true;\n' }), 'zip_path_invalid'],
    ['absolute path', () => createZipBase64({ '/escape.ts': 'export default true;\n' }), 'zip_path_invalid'],
    ['backslash path', () => createZipBase64({ 'src\\escape.ts': 'export default true;\n' }), 'zip_path_invalid'],
    [
      'case-insensitive collision',
      () => createZipBase64({ 'README.md': '# One\n', 'readme.md': '# Two\n' }),
      'zip_duplicate_path',
    ],
    [
      'invalid UTF-8/binary file',
      () => createZipBase64({ 'src/shared/binary.bin': Buffer.from([0, 255, 1]) }),
      'zip_file_not_utf8',
    ],
    [
      'NUL byte',
      () => createZipBase64({ 'src/shared/value.ts': Buffer.from('export\0const value = 1;') }),
      'zip_file_not_utf8',
    ],
    [
      'symbolic link',
      () => createSymlinkZipBase64('src/client/link.ts', '../shared/target.ts'),
      'zip_symlink_not_allowed',
    ],
  ] as const)('rejects %s', async (_label, createArchive, diagnosticCode) => {
    await expect(parseJsTemplateSourceArchive(await createArchive(), new JsTemplateValidator())).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: diagnosticCode })]),
      },
    });
  });

  it('rejects compressed, uncompressed, and per-file budget overruns before accepting source', async () => {
    const zipBase64 = await createZipBase64(
      { 'src/client/js-blocks/example/index.js': `export default ${JSON.stringify('a'.repeat(1024))};\n` },
      { compressed: true },
    );

    await expect(
      parseJsTemplateSourceArchive(zipBase64, new JsTemplateValidator({ limits: { maxZipCompressionRatio: 1 } })),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'zip_compression_ratio_too_high' })]),
      },
    });

    await expect(
      parseJsTemplateSourceArchive(zipBase64, new JsTemplateValidator({ limits: { maxFileBytes: 16 } })),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'file_size_limit_exceeded' })]),
      },
    });

    await expect(
      parseJsTemplateSourceArchive(zipBase64, new JsTemplateValidator({ limits: { maxZipBytes: 16 } })),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'zip_too_large' })]),
      },
    });
  });

  it.each([
    {
      name: 'file count',
      files: { 'README.md': '# One\n', 'js-template.json': '{"schemaVersion":1}\n' },
      limits: { maxProjectFiles: 1 },
      code: 'project_file_count_exceeded',
    },
    {
      name: 'source byte budget',
      files: { 'README.md': '12345' },
      limits: { maxProjectBytes: 4 },
      code: 'project_budget_limit_exceeded',
    },
  ])('rejects $name overruns before accepting source', async ({ files, limits, code }) => {
    const zipBase64 = await createZipBase64(files);

    await expect(parseJsTemplateSourceArchive(zipBase64, new JsTemplateValidator({ limits }))).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code })]),
      },
    });
  });

  it('rejects imports across entry roots', async () => {
    const zipBase64 = await createZipBase64({
      'src/client/js-blocks/one/entry.json': '{"schemaVersion":1,"key":"one"}\n',
      'src/client/js-blocks/one/index.tsx': 'import Two from "../two";\nctx.render(<Two />);\n',
      'src/client/js-blocks/two/entry.json': '{"schemaVersion":1,"key":"two"}\n',
      'src/client/js-blocks/two/index.tsx': 'export default function Two() { return null; }\n',
    });

    await expect(parseJsTemplateSourceArchive(zipBase64, new JsTemplateValidator())).rejects.toMatchObject({
      code: 'JS_TEMPLATE_VALIDATION_FAILED',
      details: {
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'import_not_allowed' })]),
      },
    });
  });
});
