/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { RunJSSourceError } from '@nocobase/runjs/workspace/server';
import { maxPathLength } from '../../shared/constants';
import { isVscError, VscError } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../shared/path';
import { buildRunJSSourceRepositoryIdentity, normalizeRunJSSourceLocator } from '../../shared/runjs-source-types';
import { normalizeText } from '../../shared/text';

describe('vsc-file shared utilities', () => {
  it('normalizes paths to POSIX separators without changing case', () => {
    expect(normalizePath('src\\Foo.ts')).toBe('src/Foo.ts');
  });

  it.each(['/a.ts', '../a.ts', './a.ts', 'a/./b.ts', 'a/../../b.ts', 'a//b.ts', 'a/\0/b.ts', 'a/'])(
    'rejects invalid path %s',
    (input) => {
      expect(() => normalizePath(input)).toThrowError(VscError);
      try {
        normalizePath(input);
      } catch (error) {
        expect(error).toMatchObject({ code: 'PATH_INVALID' });
      }
    },
  );

  it('rejects empty and over-limit paths', () => {
    expect(() => normalizePath('')).toThrowError(VscError);
    expect(() => normalizePath('a'.repeat(maxPathLength + 1))).toThrowError(VscError);
  });

  it('uses case-sensitive path hashes and case-insensitive lower hashes', () => {
    expect(pathHash('Foo.ts')).not.toBe(pathHash('foo.ts'));
    expect(pathLowerHash('Foo.ts')).toBe(pathLowerHash('foo.ts'));
    expect(pathHash('src\\Foo.ts')).toBe(sha256Hex('src/Foo.ts'));
    expect(pathLowerHash('src\\Foo.ts')).toBe(sha256Hex('src/foo.ts'));
  });

  it('normalizes CRLF, CR, and UTF-8 BOM without trimming whitespace', () => {
    expect(normalizeText('\ufeff a\r\nb\rc\n ')).toBe(' a\nb\nc\n ');
  });

  it('rejects text containing NUL with TEXT_ENCODING_INVALID', () => {
    expect(() => normalizeText('a\0b')).toThrowError(VscError);
    try {
      normalizeText('a\0b');
    } catch (error) {
      expect(error).toMatchObject({ code: 'TEXT_ENCODING_INVALID' });
    }
  });

  it('computes SHA-256 hex digests', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('多文件 RunJS')).toBe('ff676ccda35449a8719a620b99f467129cccaa80f02e79940c546eb4c9f97367');
    expect(sha256Hex(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it.each([
    [55, '9f4390f8d30c2dd92ec9f095b65e2b9ae9b0a925a5258e241c9f1e910f734318'],
    [56, 'b35439a4ac6f0948b6d6f9e3c6af0f5f590ce20f1bde7090ef7970686ec6738a'],
    [63, '7d3e74a05d7db15bce4ad9ec0658ea98e3f06eeecf16b4c6fff2da457ddc2f34'],
    [64, 'ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb'],
    [65, '635361c48bb9eab14198e76ea8ab7f1a41685d6ad62aa9146d301d4f17eb0ae0'],
    [128, '6836cf13bac400e9105071cd6af47084dfacad4e5e302c94bfed24e013afb73e'],
    [1000, '41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3'],
  ])('computes SHA-256 across the %i-byte padding boundary', (length, expected) => {
    expect(sha256Hex('a'.repeat(length))).toBe(expected);
  });

  it('preserves RunJS adapter errors for resource responses', () => {
    const error = new RunJSSourceError('RUNJS_SOURCE_NOT_FOUND', 'Source not found');

    expect(isVscError(error)).toBe(true);
    expect(error.toResponseBody().errors[0]).toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      status: 404,
    });
  });

  it('normalizes RunJS source locators and derives stable repository identity', () => {
    const locator = normalizeRunJSSourceLocator({
      kind: 'flowModel.step',
      modelUid: 'fm_1',
      flowKey: 'settings',
      stepKey: 'runjs',
      paramPath: ['code'],
      versionPath: ['version'],
    });
    const identity = buildRunJSSourceRepositoryIdentity(locator);

    expect(locator).toMatchObject({
      kind: 'flowModel.step',
      modelUid: 'fm_1',
      paramPath: ['code'],
    });
    expect(identity).toMatchObject({
      ownerType: 'runjs-source',
      name: 'source',
    });
    expect(identity.ownerId).toMatch(/^runjs:flowModel\.step:fm_1:[a-f0-9]{16}$/);
  });

  it('keeps RunJS source path boundaries and retained locator kinds in repository identity hashes', () => {
    const dottedA = buildRunJSSourceRepositoryIdentity(
      normalizeRunJSSourceLocator({
        kind: 'flowModel.step',
        modelUid: 'fm_1',
        flowKey: 'a.b',
        stepKey: 'c',
        paramPath: ['code'],
      }),
    );
    const dottedB = buildRunJSSourceRepositoryIdentity(
      normalizeRunJSSourceLocator({
        kind: 'flowModel.step',
        modelUid: 'fm_1',
        flowKey: 'a',
        stepKey: 'b.c',
        paramPath: ['code'],
      }),
    );
    const flowRegistryPath = buildRunJSSourceRepositoryIdentity(
      normalizeRunJSSourceLocator({
        kind: 'flowModel.flowRegistry.runjs',
        modelUid: 'fm_1',
        flowKey: 'submit',
        stepKey: 'run',
        sourcePath: ['defaultParams', 'code'],
      }),
    );
    expect(dottedA.ownerId).not.toBe(dottedB.ownerId);
    expect(flowRegistryPath.ownerId).toMatch(/^runjs:flowModel\.flowRegistry\.runjs:fm_1:[a-f0-9]{16}$/);
  });

  it('rejects malformed RunJS source locators', () => {
    expect(() =>
      normalizeRunJSSourceLocator({
        kind: 'flowModel.step',
        modelUid: 'fm_1',
        flowKey: 'settings',
        stepKey: 'runjs',
        paramPath: [],
      }),
    ).toThrowError(VscError);

    try {
      normalizeRunJSSourceLocator({ kind: 'unknown' });
    } catch (error) {
      expect(error).toMatchObject({ code: 'RUNJS_SOURCE_KIND_UNSUPPORTED' });
    }
  });

  it('rejects legacy nested RunJS locators as unsupported', () => {
    const locator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'fm_1',
      containerFlowKey: 'settings',
      containerStepKey: 'runjs',
      valuePath: ['items', 0],
      scene: 'defaultValue',
    };

    expect(() => normalizeRunJSSourceLocator(locator)).toThrowError(VscError);

    try {
      normalizeRunJSSourceLocator(locator);
    } catch (error) {
      expect(error).toMatchObject({
        code: 'RUNJS_SOURCE_KIND_UNSUPPORTED',
        details: {
          kind: 'flowModel.nestedRunJS',
        },
      });
    }
  });

  it.each([
    {
      label: 'flow key',
      segment: '__proto__',
      locator: {
        kind: 'flowModel.step',
        modelUid: 'fm_1',
        flowKey: '__proto__',
        stepKey: 'runjs',
        paramPath: ['code'],
      },
    },
    {
      label: 'parameter path',
      segment: 'constructor',
      locator: {
        kind: 'flowModel.step',
        modelUid: 'fm_1',
        flowKey: 'settings',
        stepKey: 'runjs',
        paramPath: ['constructor'],
      },
    },
    {
      label: 'flow registry source path',
      segment: 'prototype',
      locator: {
        kind: 'flowModel.flowRegistry.runjs',
        modelUid: 'fm_1',
        flowKey: 'submit',
        stepKey: 'runjs',
        sourcePath: ['defaultParams', 'prototype'],
      },
    },
  ])('rejects unsafe RunJS locator $label segments', ({ locator, segment }) => {
    expect(() => normalizeRunJSSourceLocator(locator)).toThrowError(VscError);

    try {
      normalizeRunJSSourceLocator(locator);
    } catch (error) {
      expect(error).toMatchObject({
        code: 'RUNJS_SOURCE_LOCATOR_INVALID',
        details: {
          segment,
        },
      });
    }
  });
});
