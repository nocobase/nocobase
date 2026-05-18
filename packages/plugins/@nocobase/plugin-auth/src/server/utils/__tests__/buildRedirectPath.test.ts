/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildRedirectPath } from '../buildRedirectPath';

describe('buildRedirectPath', () => {
  describe('main app', () => {
    it('falls back to /admin when target is missing', () => {
      expect(buildRedirectPath({ appPublicPath: '/nocobase' })).toBe('/nocobase/admin');
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: null })).toBe('/nocobase/admin');
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: '' })).toBe('/nocobase/admin');
    });

    it('prepends prefix to v1-style basename-relative target', () => {
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: '/admin/abc' })).toBe('/nocobase/admin/abc');
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: '/admin' })).toBe('/nocobase/admin');
    });

    it('does NOT double-prepend when v2-style target already starts with appPublicPath', () => {
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: '/nocobase/v2/admin/abc' })).toBe(
        '/nocobase/v2/admin/abc',
      );
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: '/nocobase/admin' })).toBe('/nocobase/admin');
    });

    it('treats target equal to appPublicPath as already v2-shaped', () => {
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: '/nocobase' })).toBe('/nocobase');
    });

    it('only matches a prefix followed by `/` so siblings are not confused', () => {
      // `/nocobasenull` shares the prefix as a substring but is not a
      // sub-path of `/nocobase`, so we still prepend.
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: '/nocobasenull' })).toBe('/nocobase/nocobasenull');
    });

    it('normalises trailing slashes on appPublicPath', () => {
      expect(buildRedirectPath({ appPublicPath: '/nocobase/', target: '/admin/abc' })).toBe('/nocobase/admin/abc');
      expect(buildRedirectPath({ appPublicPath: '/nocobase///', target: '/admin/abc' })).toBe('/nocobase/admin/abc');
      expect(buildRedirectPath({ appPublicPath: '/nocobase/', target: '/nocobase/v2/admin' })).toBe(
        '/nocobase/v2/admin',
      );
    });

    it('handles an empty appPublicPath (root-mounted deployment)', () => {
      expect(buildRedirectPath({ appPublicPath: '', target: '/admin' })).toBe('/admin');
      expect(buildRedirectPath({ appPublicPath: undefined, target: '/admin' })).toBe('/admin');
      expect(buildRedirectPath({ appPublicPath: '', target: '/v2/admin/abc' })).toBe('/v2/admin/abc');
    });

    it('keeps query strings and hashes intact', () => {
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: '/admin/abc?tab=x#panel' })).toBe(
        '/nocobase/admin/abc?tab=x#panel',
      );
      expect(buildRedirectPath({ appPublicPath: '/nocobase', target: '/nocobase/v2/admin?tab=x' })).toBe(
        '/nocobase/v2/admin?tab=x',
      );
    });
  });

  describe('sub-app (v1 multi-app mode)', () => {
    it('prepends both appPublicPath and sub-app segment for v1-style target', () => {
      expect(buildRedirectPath({ appPublicPath: '/nocobase', subAppSegment: '/apps/sub', target: '/admin/abc' })).toBe(
        '/nocobase/apps/sub/admin/abc',
      );
    });

    it('falls back to /admin under the full prefix when target is missing', () => {
      expect(buildRedirectPath({ appPublicPath: '/nocobase', subAppSegment: '/apps/sub' })).toBe(
        '/nocobase/apps/sub/admin',
      );
    });

    it('does NOT touch a v2-style sub-app target that already starts with appPublicPath', () => {
      // The user-reported regression: v2 sub-app redirect was being
      // double-prefixed with the v1 sub-app segment.
      expect(
        buildRedirectPath({
          appPublicPath: '/nocobase',
          subAppSegment: '/apps/a_u4940c6p189',
          target: '/nocobase/v2/apps/a_u4940c6p189/admin/al5yj9t81of',
        }),
      ).toBe('/nocobase/v2/apps/a_u4940c6p189/admin/al5yj9t81of');
    });

    it('does NOT touch a v2 main-app target even when a sub-app segment was supplied', () => {
      // Detection is appPublicPath-only; supplying subAppSegment must not
      // override the v2-detection branch.
      expect(
        buildRedirectPath({
          appPublicPath: '/nocobase',
          subAppSegment: '/apps/sub',
          target: '/nocobase/v2/admin/abc',
        }),
      ).toBe('/nocobase/v2/admin/abc');
    });

    it('normalises trailing slash on sub-app segment', () => {
      expect(buildRedirectPath({ appPublicPath: '/nocobase', subAppSegment: '/apps/sub/', target: '/admin/abc' })).toBe(
        '/nocobase/apps/sub/admin/abc',
      );
    });
  });
});
