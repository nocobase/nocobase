/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { parsePermanentFileReference } from '../file-reference';

const originalPublicPath = process.env.APP_PUBLIC_PATH;
const originalPublicOrigin = process.env.APP_PUBLIC_ORIGIN;

afterEach(() => {
  if (originalPublicPath === undefined) {
    delete process.env.APP_PUBLIC_PATH;
  } else {
    process.env.APP_PUBLIC_PATH = originalPublicPath;
  }
  if (originalPublicOrigin === undefined) {
    delete process.env.APP_PUBLIC_ORIGIN;
  } else {
    process.env.APP_PUBLIC_ORIGIN = originalPublicOrigin;
  }
});

describe('permanent file references', () => {
  it('parses relative permanent file paths with APP_PUBLIC_PATH', () => {
    process.env.APP_PUBLIC_PATH = '/nocobase';

    expect(parsePermanentFileReference('/nocobase/files/main/another/reports/42.xlsx')).toEqual({
      appName: 'main',
      dataSourceKey: 'another',
      collectionName: 'reports',
      id: '42',
      extname: '.xlsx',
    });
  });

  it('parses same-origin absolute permanent file urls using the submitted browser origin', () => {
    process.env.APP_PUBLIC_PATH = '/nocobase';
    const origin = 'https://nocobase.example.com';

    expect(
      parsePermanentFileReference('https://nocobase.example.com/nocobase/files/main/main/attachments/24.pdf', origin),
    ).toEqual({
      appName: 'main',
      dataSourceKey: 'main',
      collectionName: 'attachments',
      id: '24',
      extname: '.pdf',
    });
    expect(
      parsePermanentFileReference('https://cdn.example.com/nocobase/files/main/main/attachments/24.pdf', origin),
    ).toBeNull();
  });

  it('prefers APP_PUBLIC_ORIGIN over the submitted browser origin', () => {
    process.env.APP_PUBLIC_PATH = '/nocobase';
    process.env.APP_PUBLIC_ORIGIN = 'https://public.example.com';

    expect(
      parsePermanentFileReference(
        'https://public.example.com/nocobase/files/main/main/attachments/24.pdf',
        'https://editor.example.com',
      ),
    ).toEqual({
      appName: 'main',
      dataSourceKey: 'main',
      collectionName: 'attachments',
      id: '24',
      extname: '.pdf',
    });
    expect(
      parsePermanentFileReference(
        'https://editor.example.com/nocobase/files/main/main/attachments/24.pdf',
        'https://editor.example.com',
      ),
    ).toBeNull();
  });

  it('does not treat temporary access urls as permanent file references', () => {
    expect(
      parsePermanentFileReference('/files/main/main/attachments/24.pdf?temporaryAccessToken=temporary-token'),
    ).toBeNull();
  });

  it('rejects malformed permanent file paths', () => {
    expect(() => parsePermanentFileReference('/files/main/main/attachments')).toThrow('Invalid file URL');
    expect(() => parsePermanentFileReference('/files/main/main/attachments/%2Fetc%2Fpasswd')).toThrow(
      'Invalid file URL',
    );
  });
});
