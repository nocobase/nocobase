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
  libraries?: readonly RunJSTypeLibraryUsageDefinition[];
}

export interface RunJSTypeLibraryUsageDefinition {
  libraryName: string;
  packId: string;
  moduleNames?: readonly string[];
  topLevelNames?: readonly string[];
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

export function selectRunJSTypeLibraryRequests(
  requests: readonly RunJSTypeLibraryRequest[],
  loadedFullPackIds: ReadonlyMap<string, string> = new Map(),
): RunJSTypeLibraryRequest[] {
  const selectedByLibrary = new Map<string, Map<string, RunJSTypeLibraryRequest>>();

  for (const request of requests) {
    const loadedFullPackId = loadedFullPackIds.get(request.libraryName);
    const nextRequest: RunJSTypeLibraryRequest = loadedFullPackId
      ? { kind: 'full', libraryName: request.libraryName, packId: loadedFullPackId }
      : request;
    const selected = selectedByLibrary.get(nextRequest.libraryName) || new Map<string, RunJSTypeLibraryRequest>();
    const existingFull = [...selected.values()].find((candidate) => candidate.kind === 'full');
    if (existingFull && nextRequest.kind !== 'full') {
      selectedByLibrary.set(nextRequest.libraryName, selected);
      continue;
    }
    if (nextRequest.kind === 'full') {
      selected.clear();
    }
    selected.set(nextRequest.packId, nextRequest);
    selectedByLibrary.set(nextRequest.libraryName, selected);
  }

  return [...selectedByLibrary.values()]
    .flatMap((selected) => [...selected.values()])
    .sort((left, right) => left.packId.localeCompare(right.packId));
}
