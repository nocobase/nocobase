/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'path';
import { storagePathJoin } from '@nocobase/utils';
import { getLoggerFilePath } from '../config';

describe('getLoggerFilePath', () => {
  const root = path.resolve(storagePathJoin('logs'));

  it('should resolve a path inside the log directory', () => {
    expect(getLoggerFilePath()).toBe(root);
    expect(getLoggerFilePath('main')).toBe(path.join(root, 'main'));
    expect(getLoggerFilePath(path.join('main', 'workflows', '1'))).toBe(path.join(root, 'main', 'workflows', '1'));
  });

  it.each(['..', '../..', path.join('main', '..', '..'), '/tmp/invalid', '/var/www/html'])(
    'should reject %s escaping the log directory',
    (segment) => {
      expect(() => getLoggerFilePath(segment)).toThrow(/escapes the log directory/);
    },
  );

  it('should not be fooled by a sibling directory sharing the root prefix', () => {
    expect(() => getLoggerFilePath('..', `${path.basename(root)}-evil`)).toThrow(/escapes the log directory/);
  });
});
