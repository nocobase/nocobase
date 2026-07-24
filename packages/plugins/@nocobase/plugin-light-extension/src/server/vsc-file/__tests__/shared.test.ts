/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { RunJSSourceError } from '@nocobase/server';
import { maxPathLength } from '../../../shared/vsc-file/constants';
import { isVscError, VscError } from '../../../shared/vsc-file/errors';
import { sha256Hex } from '../../../shared/vsc-file/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../../shared/vsc-file/path';
import {
  buildRunJSSourceRepositoryIdentity,
  normalizeRunJSSourceLocator,
} from '../../../shared/vsc-file/runjs-source-types';
import { normalizeText } from '../../../shared/vsc-file/text';

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
    const chartOptionPath = buildRunJSSourceRepositoryIdentity(
      normalizeRunJSSourceLocator({
        kind: 'chart.option',
        modelUid: 'chart_1',
      }),
    );
    const chartEventsPath = buildRunJSSourceRepositoryIdentity(
      normalizeRunJSSourceLocator({
        kind: 'chart.events',
        modelUid: 'chart_1',
      }),
    );

    expect(dottedA.ownerId).not.toBe(dottedB.ownerId);
    expect(flowRegistryPath.ownerId).toMatch(/^runjs:flowModel\.flowRegistry\.runjs:fm_1:[a-f0-9]{16}$/);
    expect(chartOptionPath.ownerId).not.toBe(chartEventsPath.ownerId);
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
