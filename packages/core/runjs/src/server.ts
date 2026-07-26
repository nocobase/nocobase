/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

import { type RunJSCompileFile, stableSerialize } from './index';

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function buildRunJSFilesHash(files: RunJSCompileFile[]): string {
  return sha256Hex(stableSerialize(files));
}

export function buildRunJSRuntimeCodeHash(code: string): string {
  return sha256Hex(code);
}

export function buildRunJSArtifactHash(input: {
  code: string;
  sourceMap?: string | null;
  version: string;
  entryPath: string;
  runtimeContract: string;
}): string {
  return sha256Hex(stableSerialize(input));
}
