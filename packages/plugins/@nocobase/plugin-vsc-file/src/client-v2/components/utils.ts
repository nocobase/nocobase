/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { VscFileChange } from '../../shared/types';

export function compareVscPaths(left: string, right: string): number {
  return left.localeCompare(right);
}

export function formatVscComponentError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (!error || typeof error !== 'object' || Array.isArray(error)) {
    return fallback;
  }

  const message = (error as { message?: unknown }).message;
  return typeof message === 'string' && message ? message : fallback;
}

export function toPushFileChanges(files: VscFileChange[]): VscFileChange[] {
  return files.map((file) => {
    if (file.operation === 'delete') {
      return {
        path: file.path,
        operation: 'delete',
      };
    }

    return {
      path: file.path,
      operation: 'upsert',
      content: file.content || '',
      language: file.language,
      mode: file.mode,
    };
  });
}

export function uniquePaths(paths: string[]): string[] {
  return Array.from(new Set(paths.filter((path) => Boolean(path)))).sort(compareVscPaths);
}
