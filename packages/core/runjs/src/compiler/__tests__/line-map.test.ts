/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  getFirstMappedRunJSStackFrame,
  mapRunJSStack,
  mapRunJSStackFrame,
  parseRunJSLineMapV1,
  parseRunJSStackFrames,
  RUNJS_EVALUATION_WRAPPER_LINE_OFFSET,
  wrapRunJSCodeForEvaluation,
  type RunJSLineMapV1,
} from '../line-map';
import { compileRunJSSourceWorkspace } from '../index';

const sourceURL = 'nocobase-runjs://bundle/artifact-a.js';
const lineMap: RunJSLineMapV1 = {
  version: 1,
  kind: 'runjs-line-map',
  sourceURL,
  entryPath: 'src/main.ts',
  generatedCodeLineOffset: RUNJS_EVALUATION_WRAPPER_LINE_OFFSET,
  mappings: [
    {
      generatedLine: 3,
      generatedColumn: 5,
      source: 'src/helper.ts',
      sourceLine: 8,
      sourceColumn: 2,
    },
  ],
};

describe('RunJSLineMapV1', () => {
  it('parses only the versioned contract with safe workspace paths', () => {
    expect(parseRunJSLineMapV1(JSON.stringify(lineMap))).toEqual(lineMap);
    expect(parseRunJSLineMapV1({ ...lineMap, version: 2 })).toBeUndefined();
    expect(parseRunJSLineMapV1({ ...lineMap, entryPath: '/root/private.ts' })).toBeUndefined();
    expect(
      parseRunJSLineMapV1({
        ...lineMap,
        mappings: [{ ...lineMap.mappings[0], source: '../private.ts' }],
      }),
    ).toBeUndefined();
  });

  it('maps one-based generated lines and columns after the wrapper offset', () => {
    const frame = {
      url: sourceURL,
      line: 5,
      column: 9,
      raw: `${sourceURL}:5:9`,
    };

    expect(mapRunJSStackFrame(lineMap, frame)).toMatchObject({
      source: 'src/helper.ts',
      sourceLine: 8,
      sourceColumn: 6,
    });
  });

  it('keeps the evaluation wrapper aligned with the emitted offset contract', () => {
    const wrapped = wrapRunJSCodeForEvaluation('__RUNJS_SENTINEL__');
    const sentinelLine = wrapped.split('\n').findIndex((line) => line.includes('__RUNJS_SENTINEL__')) + 1;

    expect(sentinelLine).toBe(RUNJS_EVALUATION_WRAPPER_LINE_OFFSET + 1);
  });

  it('never maps anonymous or unrelated Artifact frames', () => {
    const stack = [
      'Error: boom',
      '    at anonymous (<anonymous>:5:9)',
      '    at other (nocobase-runjs://bundle/artifact-b.js:5:9)',
    ].join('\n');

    expect(getFirstMappedRunJSStackFrame(stack, lineMap)).toBeUndefined();
    expect(mapRunJSStack(stack, lineMap)).toBe(stack);
  });

  it('maps only the frame whose URL exactly matches the Artifact sourceURL', () => {
    const stack = [
      'Error: boom',
      '    at other (nocobase-runjs://bundle/artifact-b.js:5:9)',
      `    at current (${sourceURL}:5:9)`,
    ].join('\n');

    expect(parseRunJSStackFrames(stack)).toHaveLength(2);
    expect(getFirstMappedRunJSStackFrame(stack, lineMap)).toMatchObject({
      source: 'src/helper.ts',
      sourceLine: 8,
      sourceColumn: 6,
    });
    expect(mapRunJSStack(stack, lineMap)).toContain('src/helper.ts:8:6');
    expect(mapRunJSStack(stack, lineMap)).toContain('nocobase-runjs://bundle/artifact-b.js:5:9');
  });

  it('emits the shared wrapper and sourceURL contract for multi-file Artifacts', async () => {
    const result = await compileRunJSSourceWorkspace({
      entry: 'src/main.ts',
      surfaceStyle: 'action',
      files: [
        { path: 'src/main.ts', content: `import { fail } from './helper';\nfail();` },
        { path: 'src/helper.ts', content: `export function fail() {\n  throw new Error('boom');\n}` },
      ],
    });
    const emitted = parseRunJSLineMapV1(result.artifact.sourceMap);

    expect(result.failureCode).toBeUndefined();
    expect(emitted).toBeDefined();
    expect(emitted?.generatedCodeLineOffset).toBe(RUNJS_EVALUATION_WRAPPER_LINE_OFFSET);
    expect(result.artifact.code).toContain(`//# sourceURL=${emitted?.sourceURL}`);
    expect(emitted?.mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'src/helper.ts',
          sourceLine: 2,
        }),
      ]),
    );
  });
});
