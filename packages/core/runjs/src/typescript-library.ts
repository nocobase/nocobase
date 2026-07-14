/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface RunJSTypeLibraryFile {
  path: string;
  content: string;
  contentHash: string;
}

export interface RunJSTypeLibraryPackDependency {
  id: string;
  version: string;
  contentHash: string;
}

export interface RunJSTypeLibraryPack {
  id: string;
  libraryName: string;
  version: string;
  contentHash: string;
  dependencies: readonly RunJSTypeLibraryPackDependency[];
  rootFiles: readonly RunJSTypeLibraryFile[];
  dependencyFiles: readonly RunJSTypeLibraryFile[];
  metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface RunJSTypeLibraryUsageFile {
  path: string;
  content?: string;
  operation?: 'upsert' | 'delete';
}

export interface CollectRunJSTypeLibraryUsageInput {
  files: readonly RunJSTypeLibraryUsageFile[];
  currentFile?: {
    path: string;
    content: string;
  };
}

interface RunJSTypeLibraryRequestBase {
  packId: string;
  libraryName: string;
}

export interface RunJSTypeLibraryLevelRequest extends RunJSTypeLibraryRequestBase {
  kind: 'library';
}

export interface RunJSTypeLibraryFullRequest extends RunJSTypeLibraryRequestBase {
  kind: 'full';
}

export interface RunJSTypeLibrarySymbolRequest extends RunJSTypeLibraryRequestBase {
  kind: 'symbol';
  symbol: string;
  group?: string;
}

export type RunJSTypeLibraryRequest =
  | RunJSTypeLibraryLevelRequest
  | RunJSTypeLibraryFullRequest
  | RunJSTypeLibrarySymbolRequest;
