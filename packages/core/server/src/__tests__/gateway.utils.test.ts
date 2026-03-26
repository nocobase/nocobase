/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { injectRuntimeScript, resolveV2PublicPath, rewriteV2AssetPublicPath } from '../gateway/utils';

describe('gateway utils', () => {
  it('should resolve v2 public path from app public path', () => {
    expect(resolveV2PublicPath('/')).toBe('/v2/');
    expect(resolveV2PublicPath('/nocobase/')).toBe('/nocobase/v2/');
  });

  it('should rewrite v2 asset paths for prefixed deployment', () => {
    const html = [
      '<script>window.__nocobase_public_path__=window.__nocobase_public_path__||"/v2/"</script>',
      '<script src="/v2/assets/runtime.js" type="module"></script>',
      '<link rel="modulepreload" href="/v2/assets/index.js" />',
    ].join('');

    const rewritten = rewriteV2AssetPublicPath(html, '/nocobase/v2/');

    expect(rewritten).toContain('<script src="/nocobase/v2/assets/runtime.js" type="module"></script>');
    expect(rewritten).toContain('<link rel="modulepreload" href="/nocobase/v2/assets/index.js" />');
  });

  it('should support rewriting assets to cdn public path', () => {
    const html = '<script src="/v2/assets/runtime.js" type="module"></script>';
    expect(rewriteV2AssetPublicPath(html, 'https://cdn.example.com/nocobase/v2/')).toBe(
      '<script src="https://cdn.example.com/nocobase/v2/assets/runtime.js" type="module"></script>',
    );
  });

  it('should keep html unchanged for default v2 public path', () => {
    const html = '<script src="/v2/assets/runtime.js" type="module"></script>';
    expect(rewriteV2AssetPublicPath(html, '/v2/')).toBe(html);
  });

  it('should inject runtime script before module script', () => {
    const html = '<html><head><script src="/v2/assets/runtime.js" type="module"></script></head></html>';
    const runtimeScript = '<script>window.__nocobase_public_path__="/nocobase/v2/";</script>';

    expect(injectRuntimeScript(html, runtimeScript)).toContain(
      `${runtimeScript}\n<script src="/v2/assets/runtime.js" type="module"></script>`,
    );
  });

  it('should inject runtime script before browser-checker script', () => {
    const html = [
      '<html><head>',
      '<script>window.__nocobase_public_path__=window.__nocobase_public_path__||"/v2/"</script>',
      '<script src="/nocobase/v2/browser-checker.js?v=1"></script>',
      '<script src="/v2/assets/runtime.js" type="module"></script>',
      '</head></html>',
    ].join('');
    const runtimeScript = '<script>window.__nocobase_public_path__="/nocobase/v2/";</script>';

    expect(injectRuntimeScript(html, runtimeScript)).toContain(
      `${runtimeScript}\n<script src="/nocobase/v2/browser-checker.js?v=1"></script>`,
    );
  });
});
