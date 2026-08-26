/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, test } from 'vitest';
import { resolveAppUrlFromApiBaseUrl } from '../commands/env/shared.js';

test('resolveAppUrlFromApiBaseUrl derives the root app url from api base urls', () => {
  expect(resolveAppUrlFromApiBaseUrl('https://demo.example.com/api')).toBe('https://demo.example.com/');
  expect(resolveAppUrlFromApiBaseUrl('https://demo.example.com/base/api')).toBe('https://demo.example.com/base/');
});

test('resolveAppUrlFromApiBaseUrl derives subapp urls from api base urls', () => {
  expect(resolveAppUrlFromApiBaseUrl('https://demo.example.com/api/__app/analytics')).toBe(
    'https://demo.example.com/apps/analytics/',
  );
  expect(resolveAppUrlFromApiBaseUrl('https://demo.example.com/base/api/__app/analytics')).toBe(
    'https://demo.example.com/base/apps/analytics/',
  );
});
