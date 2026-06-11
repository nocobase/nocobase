/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';
import {
  injectRuntimeScript,
  MODERN_CLIENT_DIST_DIR,
  normalizeModernClientPrefix,
  resolveV2PublicPath,
  rewriteV2AssetPublicPath,
} from '../gateway/utils';

const DIR = MODERN_CLIENT_DIST_DIR; // fixed build-output dir / rewrite sentinel, e.g. `v`

describe('gateway utils', () => {
  afterEach(() => {
    delete process.env.APP_MODERN_CLIENT_PREFIX;
  });

  it('normalizes the modern client prefix', () => {
    expect(normalizeModernClientPrefix('v')).toBe('v');
    expect(normalizeModernClientPrefix('/v')).toBe('v');
    expect(normalizeModernClientPrefix('/v/')).toBe('v');
    expect(normalizeModernClientPrefix('')).toBe(DIR);
    expect(normalizeModernClientPrefix(undefined)).toBe(DIR);
  });

  it('should resolve modern client public path from app public path (default prefix)', () => {
    expect(resolveV2PublicPath('/')).toBe(`/${DIR}/`);
    expect(resolveV2PublicPath('/nocobase/')).toBe(`/nocobase/${DIR}/`);
  });

  it('should resolve modern client public path honoring APP_MODERN_CLIENT_PREFIX', () => {
    process.env.APP_MODERN_CLIENT_PREFIX = '/admin/';
    expect(resolveV2PublicPath('/')).toBe('/admin/');
    expect(resolveV2PublicPath('/nocobase/')).toBe('/nocobase/admin/');
  });

  it('should rewrite modern asset paths for prefixed deployment', () => {
    const html = [
      `<script>window.__nocobase_public_path__=window.__nocobase_public_path__||"/${DIR}/"</script>`,
      `<script src="/${DIR}/assets/runtime.js" type="module"></script>`,
      `<link rel="modulepreload" href="/${DIR}/assets/index.js" />`,
    ].join('');

    const rewritten = rewriteV2AssetPublicPath(html, `/nocobase/${DIR}/`);

    expect(rewritten).toContain(`<script src="/nocobase/${DIR}/assets/runtime.js" type="module"></script>`);
    expect(rewritten).toContain(`<link rel="modulepreload" href="/nocobase/${DIR}/assets/index.js" />`);
  });

  it('should support rewriting assets to cdn public path', () => {
    const html = `<script src="/${DIR}/assets/runtime.js" type="module"></script>`;
    expect(rewriteV2AssetPublicPath(html, `https://cdn.example.com/nocobase/${DIR}/`)).toBe(
      `<script src="https://cdn.example.com/nocobase/${DIR}/assets/runtime.js" type="module"></script>`,
    );
  });

  it('should keep html unchanged for default modern public path', () => {
    const html = `<script src="/${DIR}/assets/runtime.js" type="module"></script>`;
    expect(rewriteV2AssetPublicPath(html, `/${DIR}/`)).toBe(html);
  });

  it('should inject runtime script before module script', () => {
    const html = `<html><head><script src="/${DIR}/assets/runtime.js" type="module"></script></head></html>`;
    const runtimeScript = `<script>window.__nocobase_public_path__="/nocobase/${DIR}/";</script>`;

    expect(injectRuntimeScript(html, runtimeScript)).toContain(
      `${runtimeScript}\n<script src="/${DIR}/assets/runtime.js" type="module"></script>`,
    );
  });

  it('should inject runtime script before browser-checker script', () => {
    const html = [
      '<html><head>',
      `<script>window.__nocobase_public_path__=window.__nocobase_public_path__||"/${DIR}/"</script>`,
      `<script src="/nocobase/${DIR}/browser-checker.js?v=1"></script>`,
      `<script src="/${DIR}/assets/runtime.js" type="module"></script>`,
      '</head></html>',
    ].join('');
    const runtimeScript = `<script>window.__nocobase_public_path__="/nocobase/${DIR}/";</script>`;

    expect(injectRuntimeScript(html, runtimeScript)).toContain(
      `${runtimeScript}\n<script src="/nocobase/${DIR}/browser-checker.js?v=1"></script>`,
    );
  });
});
