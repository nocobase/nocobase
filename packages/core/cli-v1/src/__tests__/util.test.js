/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const { colorizedDevLogEnv, createRunWithPrefixLabel } = require('../util')._test;

describe('cli-v1 util helpers', () => {
  test('colorizedDevLogEnv enables color for dev child output by default', () => {
    expect(colorizedDevLogEnv({})).toEqual({ FORCE_COLOR: '1' });
  });

  test('colorizedDevLogEnv keeps explicit FORCE_COLOR', () => {
    expect(colorizedDevLogEnv({ FORCE_COLOR: '3' })).toEqual({ FORCE_COLOR: '3' });
  });

  test('colorizedDevLogEnv removes inherited NO_COLOR so dev logs stay colored', () => {
    expect(colorizedDevLogEnv({ NO_COLOR: '1', TERM: 'dumb' })).toEqual({
      FORCE_COLOR: '1',
      TERM: 'dumb',
    });
  });

  test('createRunWithPrefixLabel colorizes prefixed output even when the parent disables colors', () => {
    expect(createRunWithPrefixLabel('client', 'cyan')).toBe('\u001b[36m[client]\u001b[39m');
  });
});
