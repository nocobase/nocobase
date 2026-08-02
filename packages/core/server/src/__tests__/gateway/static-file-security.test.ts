/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getStorageUploadSecurityHeaders, hasActiveContentExtension } from '../../gateway/static-file-security';

describe('static file security', () => {
  it('should detect active content file extensions', () => {
    expect(hasActiveContentExtension('/storage/uploads/a.html')).toBe(true);
    expect(hasActiveContentExtension('/storage/uploads/a.pdf')).toBe(true);
    expect(hasActiveContentExtension('/storage/uploads/a.SVG')).toBe(true);
    expect(hasActiveContentExtension('/storage/uploads/a.svgz?download=1')).toBe(true);
    expect(hasActiveContentExtension('/storage/uploads/a.xml')).toBe(true);
    expect(hasActiveContentExtension('/storage/uploads/a.xsl')).toBe(true);
    expect(hasActiveContentExtension('/storage/uploads/a.txt')).toBe(false);
  });

  it('should sandbox uploads and force attachment for active content', () => {
    expect(getStorageUploadSecurityHeaders('/storage/uploads/a.xhtml')).toEqual({
      'Content-Disposition': 'attachment',
      'Content-Security-Policy': 'sandbox',
      'X-Content-Type-Options': 'nosniff',
    });

    expect(getStorageUploadSecurityHeaders('/storage/uploads/a.pdf')).toEqual({
      'Content-Disposition': 'attachment',
      'Content-Security-Policy': 'sandbox',
      'X-Content-Type-Options': 'nosniff',
    });

    expect(getStorageUploadSecurityHeaders('/storage/uploads/a.xml')).toEqual({
      'Content-Disposition': 'attachment',
      'Content-Security-Policy': 'sandbox',
      'X-Content-Type-Options': 'nosniff',
    });

    expect(getStorageUploadSecurityHeaders('/storage/uploads/a.txt')).toEqual({
      'Content-Security-Policy': 'sandbox',
      'X-Content-Type-Options': 'nosniff',
    });
  });
});
