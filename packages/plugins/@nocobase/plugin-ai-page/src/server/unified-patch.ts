/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export function applyUnifiedPatch(source: string, patch: string) {
  const sourceLines = source.split('\n');
  const patchLines = patch.replace(/\r\n/g, '\n').split('\n');
  const result: string[] = [];
  let sourceIndex = 0;
  let patchIndex = 0;

  while (patchIndex < patchLines.length && !patchLines[patchIndex].startsWith('@@ ')) {
    patchIndex += 1;
  }

  while (patchIndex < patchLines.length) {
    const match = patchLines[patchIndex].match(HUNK_HEADER);
    if (!match) {
      throw new Error(`Invalid unified diff hunk: ${patchLines[patchIndex]}`);
    }
    const oldStartLine = Number(match[1]);
    const oldStart = oldStartLine === 0 ? 0 : oldStartLine - 1;
    if (oldStart < sourceIndex) {
      throw new Error('Unified diff hunks are out of order');
    }
    result.push(...sourceLines.slice(sourceIndex, oldStart));
    sourceIndex = oldStart;
    patchIndex += 1;

    while (patchIndex < patchLines.length && !patchLines[patchIndex].startsWith('@@ ')) {
      const line = patchLines[patchIndex];
      if (line === '\\ No newline at end of file') {
        patchIndex += 1;
        continue;
      }
      const marker = line[0];
      const content = line.slice(1);
      if (marker === ' ') {
        if (sourceLines[sourceIndex] !== content) {
          throw new Error(`Unified diff context does not match at line ${sourceIndex + 1}`);
        }
        result.push(content);
        sourceIndex += 1;
      } else if (marker === '-') {
        if (sourceLines[sourceIndex] !== content) {
          throw new Error(`Unified diff removal does not match at line ${sourceIndex + 1}`);
        }
        sourceIndex += 1;
      } else if (marker === '+') {
        result.push(content);
      } else if (line !== '') {
        throw new Error(`Invalid unified diff line: ${line}`);
      }
      patchIndex += 1;
    }
  }

  result.push(...sourceLines.slice(sourceIndex));
  return result.join('\n');
}
