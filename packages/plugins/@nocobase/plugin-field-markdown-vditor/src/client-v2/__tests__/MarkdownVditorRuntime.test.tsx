/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownVditorRuntime } from '../runtime';

vi.mock('@nocobase/client-v2', () => ({
  stripModernClientPrefix: (path: string) => path.replace('/v2/', '/'),
}));

vi.mock('../components/Display', () => ({
  Display: ({ value, ellipsis }: { value: string; ellipsis?: boolean }) => (
    <span data-testid="display" data-ellipsis={ellipsis ? 'yes' : 'no'}>
      {value}
    </span>
  ),
}));

vi.mock('../components', () => ({
  MarkdownVditor: ({ value }: { value?: string }) => <textarea aria-label="markdown-vditor" value={value} readOnly />,
}));

describe('MarkdownVditorRuntime', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('uses jsdelivr in development and exposes dependencies from the CDN', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const runtime = new MarkdownVditorRuntime({} as never, () => '/v2/');

    expect(runtime.getCDN()).toBe('https://cdn.jsdelivr.net/npm/vditor@3.11.2');
    expect(runtime.dependencies).toEqual({
      cdn: 'https://cdn.jsdelivr.net/npm/vditor@3.11.2',
    });
  });

  it('builds the production CDN from the public path', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const getCdnUrl = vi.fn(() => '/admin/');
    const runtime = new MarkdownVditorRuntime({ getCdnUrl } as never, () => '/v2/admin/');

    expect(runtime.getCDN()).toBe('/admin/static/plugins/@nocobase/plugin-block-markdown/dist/client/vditor');
    expect(getCdnUrl).toHaveBeenCalledTimes(1);
  });

  it('loads vditor optional dependencies through requirejs', () => {
    const requireFn = vi.fn((deps: string[], callback: (module: string) => void) => {
      callback(`module:${deps[0]}`);
    });
    requireFn.config = vi.fn();
    const runtime = new MarkdownVditorRuntime(
      {
        requirejs: {
          require: requireFn,
        },
      } as never,
      () => '/v2/',
    );

    runtime.initVditorDependency();

    expect(requireFn.config).toHaveBeenCalledWith({
      waitSeconds: 120,
      paths: expect.objectContaining({
        'plugin-field-markdown-vditor-dep.katex':
          'https://cdn.jsdelivr.net/npm/vditor@3.11.2/dist/js/katex/katex.min.js?v=0.16.9',
        'plugin-field-markdown-vditor-dep.mermaid':
          'https://cdn.jsdelivr.net/npm/vditor@3.11.2/dist/js/mermaid/mermaid.min',
      }),
    });
    expect(requireFn).toHaveBeenCalledWith(['plugin-field-markdown-vditor-dep.katex'], expect.any(Function));
    expect((window as unknown as Record<string, string>).katex).toBe('module:plugin-field-markdown-vditor-dep.katex');
  });

  it('logs dependency loading failures without throwing', () => {
    const error = new Error('requirejs failed');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const requireFn = vi.fn();
    requireFn.config = vi.fn(() => {
      throw error;
    });
    const runtime = new MarkdownVditorRuntime(
      {
        requirejs: {
          require: requireFn,
        },
      } as never,
      () => '/v2/',
    );

    expect(() => runtime.initVditorDependency()).not.toThrow();
    expect(logSpy).toHaveBeenCalledWith('initVditorDependency failed', error);
  });

  it('renders markdown text and edit controls through runtime components', () => {
    const runtime = new MarkdownVditorRuntime({} as never, () => '/v2/');

    expect(runtime.render('')).toBeNull();

    render(
      <>
        {runtime.render('hello', { ellipsis: true })}
        {runtime.edit({ value: 'draft' })}
      </>,
    );

    expect(screen.getByTestId('display')).toHaveTextContent('hello');
    expect(screen.getByTestId('display')).toHaveAttribute('data-ellipsis', 'yes');
    expect(screen.getByLabelText('markdown-vditor')).toHaveValue('draft');
  });
});
