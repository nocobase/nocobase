/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePath } from '../../shared/path';
import { normalizeText } from '../../shared/text';
import type { VscFileChange } from '../../shared/types';

export type CanonicalRunJSCompileFile = VscFileChange & {
  content: string;
  operation: 'upsert';
};

export function canonicalizeRunJSCompileFile(file: {
  path: string;
  content: string;
  language?: string;
  mode?: string;
}): CanonicalRunJSCompileFile {
  const change: CanonicalRunJSCompileFile = {
    path: normalizePath(file.path),
    operation: 'upsert',
    content: normalizeText(file.content),
  };
  if (file.language) {
    change.language = file.language;
  }
  if (file.mode) {
    change.mode = file.mode;
  }
  return change;
}

export function canonicalizeRunJSCompileFiles(
  files: Array<{ path: string; content: string; language?: string; mode?: string }>,
  currentFiles: Array<{ path: string; language?: string; mode?: string }> = [],
): CanonicalRunJSCompileFile[] {
  const currentFilesByPath = new Map(currentFiles.map((file) => [normalizePath(file.path), file]));
  return files
    .map((file) => {
      const currentFile = currentFilesByPath.get(normalizePath(file.path));
      return canonicalizeRunJSCompileFile({
        ...file,
        language: file.language || currentFile?.language,
        mode: file.mode || currentFile?.mode,
      });
    })
    .sort((left, right) => left.path.localeCompare(right.path));
}
