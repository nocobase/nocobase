/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import {
  MarkdownVditorRuntime,
  registerMarkdownVditorContext,
  VDITOR_MARKDOWN_ENGINE,
  VditorEditor,
  VditorPreview,
} from '../runtime';

describe('MarkdownVditorRuntime', () => {
  const runtime = new MarkdownVditorRuntime(
    {
      requirejs: {
        require: {
          config: () => {},
        },
      },
    },
    () => '/v/',
  );

  it('provides a markdown engine contract', () => {
    expect(runtime.name).toBe(VDITOR_MARKDOWN_ENGINE);
    expect(runtime.Editor).toBe(VditorEditor);
    expect(runtime.Preview).toBe(VditorPreview);
  });

  it('renders preview and editor elements', () => {
    const preview = runtime.render('# Hello', { textOnly: false });
    const editor = runtime.edit({ value: '# Hello' });

    expect(React.isValidElement(preview)).toBe(true);
    expect(React.isValidElement(editor)).toBe(true);
    expect((preview as React.ReactElement).type).toBe(VditorPreview);
    expect((editor as React.ReactElement).type).toBe(VditorEditor);
  });

  it('registers legacy markdownVditor context aliases', () => {
    const context: {
      markdownVditor?: MarkdownVditorRuntime;
      markdownVditorDependencies?: Record<string, unknown>;
      defineProperty: (key: string, options: { get?: () => unknown }) => void;
    } = {
      defineProperty(key, options) {
        Object.defineProperty(this, key, {
          configurable: true,
          get: options.get,
        });
      },
    };

    registerMarkdownVditorContext(context, runtime);

    expect(context.markdownVditor).toBe(runtime);
    expect(context.markdownVditorDependencies).toEqual(runtime.dependencies);
  });
});
