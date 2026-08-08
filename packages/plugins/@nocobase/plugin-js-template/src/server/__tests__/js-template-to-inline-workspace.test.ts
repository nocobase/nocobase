/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import {
  buildJsTemplateInlineOverwriteChanges,
  convertJsTemplateToInlineWorkspace,
  createRunJSInlineManifestFile,
} from '../services/conversion/jsTemplateToInlineWorkspace';

describe('JS Template to Inline workspace conversion', () => {
  it('relocates the reachable source closure while preserving authoring imports for compiler preparation', () => {
    const result = convertJsTemplateToInlineWorkspace({
      entryPath: 'src/client/js-pages/orders/index.tsx',
      runtimeVersion: 'v2',
      files: [
        {
          path: 'src/client/js-pages/orders/index.tsx',
          content: [
            'import { type JSPageContext, defineSettings } from "@nocobase/js-template-sdk/client";',
            'import type { Settings } from "js-template:settings/client/js-page/orders";',
            'import { title } from "./title";',
            'const settings = defineSettings({ title });',
            'function inspect(value: JSPageContext<Settings>) { return value.page.uid; }',
            'ctx.render(<div>{settings.title}</div>);',
            '',
          ].join('\n'),
        },
        {
          path: 'src/client/js-pages/orders/title.ts',
          content: 'export const title = "Orders";\n',
        },
        {
          path: 'src/client/js-pages/orders/entry.json',
          content: '{"schemaVersion":1,"key":"orders"}\n',
          language: 'json',
        },
        {
          path: 'src/client/js-pages/sibling/index.tsx',
          content: 'ctx.render(<div>Sibling</div>);\n',
        },
      ],
    });

    expect(result.entryPath).toBe('src/client/index.tsx');
    expect(result.runtimeVersion).toBe('v2');
    expect(result.files.map((file) => file.path)).toEqual([
      'src/client/entry.json',
      'src/client/index.tsx',
      'src/client/title.ts',
    ]);
    const entry = result.files.find((file) => file.path === result.entryPath)?.content || '';
    expect(entry).toContain('from "./title"');
    expect(entry).toContain('from "@nocobase/js-template-sdk/client"');
    expect(entry).toContain('from "js-template:settings/client/js-page/orders"');
    expect(entry).not.toContain('function defineSettings<TSettings>(settings: TSettings): TSettings');
  });

  it('builds the canonical RunJS manifest from the converted runtime contract', () => {
    const manifest = createRunJSInlineManifestFile({
      entryPath: 'src/client/index.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
    });

    expect(manifest).toEqual({
      path: '.nocobase/runjs-source.json',
      language: 'json',
      content: expect.any(String),
    });
    expect(JSON.parse(manifest.content)).toEqual({
      schemaVersion: 1,
      entry: 'src/client/index.tsx',
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      compiler: {
        module: 'virtual-esm',
        jsx: true,
      },
    });
  });

  it('creates a sorted overwrite set with stale target files deleted', () => {
    const changes = buildJsTemplateInlineOverwriteChanges(
      [{ path: 'src/client/old.ts' }, { path: 'src/client/index.tsx' }],
      [
        { path: 'src/client/index.tsx', content: 'ctx.render(<div />);\n' },
        { path: '.nocobase/runjs-source.json', content: '{}\n', language: 'json' },
      ],
    );

    expect(changes).toEqual([
      {
        path: '.nocobase/runjs-source.json',
        content: '{}\n',
        language: 'json',
        operation: 'upsert',
      },
      {
        path: 'src/client/index.tsx',
        content: 'ctx.render(<div />);\n',
        operation: 'upsert',
      },
      {
        path: 'src/client/old.ts',
        operation: 'delete',
      },
    ]);
  });
});
