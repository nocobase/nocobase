/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import {
  formatUnsupportedNodeVersionMessage,
  getNodeMajorVersion,
  isSupportedNodeVersion,
  MINIMUM_NODE_MAJOR_VERSION,
} from '../../bin/node-version.js';

describe('getNodeMajorVersion', () => {
  test('parses versions with or without a v prefix', () => {
    expect(getNodeMajorVersion('v22.3.0')).toBe(22);
    expect(getNodeMajorVersion('23.1.0')).toBe(23);
  });

  test('returns NaN for invalid versions', () => {
    expect(Number.isNaN(getNodeMajorVersion('unknown'))).toBe(true);
  });
});

describe('isSupportedNodeVersion', () => {
  test('rejects node versions below the minimum requirement', () => {
    expect(isSupportedNodeVersion('21.9.0')).toBe(false);
  });

  test('accepts node versions at or above the minimum requirement', () => {
    expect(isSupportedNodeVersion(`v${MINIMUM_NODE_MAJOR_VERSION}.0.0`)).toBe(true);
    expect(isSupportedNodeVersion('24.0.1')).toBe(true);
  });
});

test('formatUnsupportedNodeVersionMessage asks users to install node 22 or later', () => {
  expect(formatUnsupportedNodeVersionMessage('v20.16.0')).toBe(
    [
      '[nocobase cli]: Node.js 22 or later is required to run nb.',
      '[nocobase cli]: Current version: v20.16.0. Please install Node.js 22 or later and try again.',
    ].join('\n'),
  );
});
