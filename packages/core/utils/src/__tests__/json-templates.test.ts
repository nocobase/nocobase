/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parse } from '../json-templates';

describe('json-templates', () => {
  it('parse json with string template', () => {
    const template = {
      name: '{{id}}-{{name}}.',
      age: 18,
    };
    const result = parse(template)({
      name: 'test',
      id: 1,
    });
    expect(result).toEqual({
      name: '1-test.',
      age: 18,
    });
  });

  it('parse nested key with options.rawKey as true', () => {
    expect(parse('{{a.b}}', { rawKey: true })({ 'a.b': 2 })).toBe(2);
  });

  it('not parse nested key without options.rawKey as true', () => {
    expect(parse('{{a.b}}')({ a: { b: 1 } })).toBe(1);
  });

  it('parse with variable path contains number', () => {
    const template = {
      name: '{{123.456}}',
    };
    const result = parse(template)({
      123: {
        456: 'abc',
      },
    });
    expect(result).toEqual({
      name: 'abc',
    });
  });

  it('parse with variable path contains chinese characters', () => {
    const template = {
      name: '{{中文id}}-{{user.中文name}}.',
    };
    const result = parse(template)({
      中文id: 123,
      user: {
        中文name: 'abc',
      },
    });
    expect(result).toEqual({
      name: '123-abc.',
    });
  });

  it('parse more than one key path', () => {
    const template = {
      name: '{{a.b.c}}',
    };
    const result = parse(template)({
      a: {
        b: {
          c: 1,
        },
      },
    });
    expect(result).toEqual({
      name: 1,
    });
  });
});
