/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';

import { diffMaxFileSize } from '../../shared/constants';
import { VscError } from '../../shared/errors';
import { normalizePath, pathHash } from '../../shared/path';
import type { VscCommitRecord, VscNormalizedTreeEntry, VscStoredBlob } from '../../shared/types';
import { BlobService } from './BlobService';
import { CommitService } from './CommitService';
import { RepositoryService } from './RepositoryService';
import { TreeService } from './TreeService';

const maxLineDiffLines = 20000;
const maxLineDiffComparisons = 1000000;
export type VscFileDiffStatus = 'added' | 'modified' | 'deleted' | 'unchanged' | 'renamed';

export interface DiffCommitsInput {
  repoId: string;
  fromCommitId: string;
  toCommitId: string;
}

export type DiffFileEndpoint =
  | {
      type: 'commit';
      commitId: string;
      path: string;
    }
  | {
      type: 'blob';
      blobHash: string;
    };

export interface DiffFileInput {
  repoId: string;
  from?: DiffFileEndpoint | null;
  to?: DiffFileEndpoint | null;
}

export interface FileDiffEntry {
  status: VscFileDiffStatus;
  path: string;
  pathHash: string;
  oldPath?: string;
  oldPathHash?: string;
  blobHash?: string;
  oldBlobHash?: string;
  language?: string;
  oldLanguage?: string;
  mode?: string;
  oldMode?: string;
  size?: number;
  oldSize?: number;
  additions?: number;
  deletions?: number;
  tooLarge: boolean;
}

export interface FileDiffSummary {
  added: number;
  modified: number;
  deleted: number;
  unchanged: number;
  renamed: number;
}

export interface FileDiffResult {
  files: FileDiffEntry[];
  summary: FileDiffSummary;
}

export type LineDiffType = 'context' | 'delete' | 'insert';

export interface LineDiffLine {
  type: LineDiffType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface LineDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: LineDiffLine[];
}

export interface DiffFileResult {
  tooLarge: boolean;
  additions?: number;
  deletions?: number;
  hunks: LineDiffHunk[];
}

interface ComparableFileEntry {
  path: string;
  pathHash: string;
  blobHash: string;
  size: number;
  language: string;
  mode: string;
}

interface ResolvedContent {
  exists: boolean;
  size: number;
  content: string;
}

interface LineToken {
  content: string;
  terminated: boolean;
}

interface LineDiffOperation {
  type: LineDiffType;
  oldIndex?: number;
  newIndex?: number;
}

type TextDiffResult = Pick<DiffFileResult, 'additions' | 'deletions' | 'hunks' | 'tooLarge'>;

export class DiffService {
  private readonly blobService: BlobService;

  private readonly commitService: CommitService;

  private readonly repositoryService: RepositoryService;

  private readonly treeService: TreeService;

  constructor(
    private readonly db: Database,
    blobService?: BlobService,
    commitService?: CommitService,
    repositoryService?: RepositoryService,
    treeService?: TreeService,
  ) {
    this.blobService = blobService || new BlobService(db);
    this.commitService = commitService || new CommitService(db);
    this.repositoryService = repositoryService || new RepositoryService(db);
    this.treeService = treeService || new TreeService(db, this.blobService);
  }

  async diffCommits(input: DiffCommitsInput, transaction?: Transaction): Promise<FileDiffResult> {
    const fromCommit = await this.commitService.getCommit(input.repoId, input.fromCommitId, transaction);
    const toCommit = await this.commitService.getCommit(input.repoId, input.toCommitId, transaction);
    const fromEntries = await this.loadCommitEntries(fromCommit, transaction);
    const toEntries = await this.loadCommitEntries(toCommit, transaction);

    return this.compareEntries(fromEntries, toEntries, transaction);
  }

  async diffFile(input: DiffFileInput, transaction?: Transaction): Promise<DiffFileResult> {
    await this.repositoryService.getRepository(input.repoId, transaction);
    const from = await this.resolveEndpoint(input.repoId, input.from || null, transaction);
    const to = await this.resolveEndpoint(input.repoId, input.to || null, transaction);

    if ((from.exists && from.size > diffMaxFileSize) || (to.exists && to.size > diffMaxFileSize)) {
      return {
        tooLarge: true,
        hunks: [],
      };
    }

    const lineDiff = diffText(from.content, to.content);
    if (lineDiff.tooLarge) {
      return {
        tooLarge: true,
        hunks: [],
      };
    }

    return {
      tooLarge: false,
      additions: lineDiff.additions,
      deletions: lineDiff.deletions,
      hunks: lineDiff.hunks,
    };
  }

  private async compareEntries(
    fromEntries: ComparableFileEntry[],
    toEntries: ComparableFileEntry[],
    transaction?: Transaction,
  ): Promise<FileDiffResult> {
    const toByPathHash = new Map(toEntries.map((entry) => [entry.pathHash, entry]));
    const deletedCandidates: ComparableFileEntry[] = [];
    const addedCandidates: ComparableFileEntry[] = [];
    const files: FileDiffEntry[] = [];

    for (const fromEntry of fromEntries) {
      const toEntry = toByPathHash.get(fromEntry.pathHash);
      if (!toEntry) {
        deletedCandidates.push(fromEntry);
        continue;
      }

      toByPathHash.delete(toEntry.pathHash);

      if (isUnchangedEntry(fromEntry, toEntry)) {
        files.push({
          status: 'unchanged',
          path: toEntry.path,
          pathHash: toEntry.pathHash,
          blobHash: toEntry.blobHash,
          oldBlobHash: fromEntry.blobHash,
          language: toEntry.language,
          oldLanguage: fromEntry.language,
          mode: toEntry.mode,
          oldMode: fromEntry.mode,
          size: toEntry.size,
          oldSize: fromEntry.size,
          additions: 0,
          deletions: 0,
          tooLarge: false,
        });
        continue;
      }

      files.push(await this.createModifiedEntry(fromEntry, toEntry, transaction));
    }

    for (const toEntry of toByPathHash.values()) {
      addedCandidates.push(toEntry);
    }

    const addedByBlobHash = groupEntriesByBlobHash(addedCandidates);
    const renamedFromEntries = new Set<string>();
    const renamedToEntries = new Set<string>();

    for (const deletedEntry of deletedCandidates) {
      const addedEntries = addedByBlobHash.get(deletedEntry.blobHash);
      const addedEntry = addedEntries?.find((entry) => !renamedToEntries.has(entry.pathHash));
      if (!addedEntry) {
        continue;
      }

      renamedFromEntries.add(deletedEntry.pathHash);
      renamedToEntries.add(addedEntry.pathHash);
      files.push({
        status: 'renamed',
        path: addedEntry.path,
        pathHash: addedEntry.pathHash,
        oldPath: deletedEntry.path,
        oldPathHash: deletedEntry.pathHash,
        blobHash: addedEntry.blobHash,
        oldBlobHash: deletedEntry.blobHash,
        language: addedEntry.language,
        oldLanguage: deletedEntry.language,
        mode: addedEntry.mode,
        oldMode: deletedEntry.mode,
        size: addedEntry.size,
        oldSize: deletedEntry.size,
        additions: 0,
        deletions: 0,
        tooLarge: false,
      });
    }

    for (const deletedEntry of deletedCandidates) {
      if (!renamedFromEntries.has(deletedEntry.pathHash)) {
        files.push(await this.createChangedEntry('deleted', deletedEntry, null, transaction));
      }
    }
    for (const addedEntry of addedCandidates) {
      if (!renamedToEntries.has(addedEntry.pathHash)) {
        files.push(await this.createChangedEntry('added', null, addedEntry, transaction));
      }
    }

    files.sort(compareFileDiffEntries);

    return {
      files,
      summary: summarizeFileDiff(files),
    };
  }

  private async createChangedEntry(
    status: 'added' | 'modified' | 'deleted',
    fromEntry: ComparableFileEntry | null,
    toEntry: ComparableFileEntry | null,
    transaction?: Transaction,
  ): Promise<FileDiffEntry> {
    const oldSize = fromEntry?.size || 0;
    const size = toEntry?.size || 0;
    const tooLarge = oldSize > diffMaxFileSize || size > diffMaxFileSize;
    const entry: FileDiffEntry = {
      status,
      path: toEntry?.path || fromEntry?.path || '',
      pathHash: toEntry?.pathHash || fromEntry?.pathHash || '',
      oldPath: fromEntry?.path,
      oldPathHash: fromEntry?.pathHash,
      blobHash: toEntry?.blobHash,
      oldBlobHash: fromEntry?.blobHash,
      language: toEntry?.language,
      oldLanguage: fromEntry?.language,
      mode: toEntry?.mode,
      oldMode: fromEntry?.mode,
      size: toEntry?.size,
      oldSize: fromEntry?.size,
      tooLarge,
    };

    if (tooLarge) {
      return entry;
    }

    const fromContent = fromEntry ? (await this.getBlob(fromEntry.blobHash, transaction)).content : '';
    const toContent = toEntry ? (await this.getBlob(toEntry.blobHash, transaction)).content : '';
    const lineDiff = diffText(fromContent, toContent);
    if (lineDiff.tooLarge) {
      return {
        ...entry,
        tooLarge: true,
      };
    }

    return {
      ...entry,
      additions: lineDiff.additions,
      deletions: lineDiff.deletions,
    };
  }

  private async createModifiedEntry(
    fromEntry: ComparableFileEntry,
    toEntry: ComparableFileEntry,
    transaction?: Transaction,
  ): Promise<FileDiffEntry> {
    if (fromEntry.blobHash !== toEntry.blobHash) {
      return this.createChangedEntry('modified', fromEntry, toEntry, transaction);
    }

    return {
      status: 'modified',
      path: toEntry.path,
      pathHash: toEntry.pathHash,
      oldPath: fromEntry.path,
      oldPathHash: fromEntry.pathHash,
      blobHash: toEntry.blobHash,
      oldBlobHash: fromEntry.blobHash,
      language: toEntry.language,
      oldLanguage: fromEntry.language,
      mode: toEntry.mode,
      oldMode: fromEntry.mode,
      size: toEntry.size,
      oldSize: fromEntry.size,
      additions: 0,
      deletions: 0,
      tooLarge: false,
    };
  }

  private async loadCommitEntries(commit: VscCommitRecord, transaction?: Transaction): Promise<ComparableFileEntry[]> {
    return (await this.treeService.loadTreeEntries(commit.treeHash, { transaction })).map(comparableEntryFromTreeEntry);
  }

  private async resolveEndpoint(
    repoId: string,
    endpoint: DiffFileEndpoint | null,
    transaction?: Transaction,
  ): Promise<ResolvedContent> {
    if (!endpoint) {
      return emptyContent();
    }

    if (endpoint.type === 'blob') {
      return contentFromBlob(await this.getBlob(endpoint.blobHash, transaction));
    }

    const normalizedPath = normalizePath(endpoint.path);
    if (endpoint.type === 'commit') {
      const commit = await this.commitService.getCommit(repoId, endpoint.commitId, transaction);
      return this.resolveTreeContent(commit.treeHash, normalizedPath, transaction);
    }

    throw new VscError('PATH_INVALID', 'Unsupported diff endpoint type');
  }

  private async resolveTreeContent(
    treeHash: string,
    normalizedPath: string,
    transaction?: Transaction,
  ): Promise<ResolvedContent> {
    const entry = (await this.treeService.loadTreeEntries(treeHash, { transaction })).find(
      (item) => item.pathHash === pathHash(normalizedPath),
    );
    if (!entry) {
      return emptyContent();
    }

    return contentFromBlob(await this.getBlob(entry.blobHash, transaction));
  }

  private async getBlob(blobHash: string, transaction?: Transaction): Promise<VscStoredBlob> {
    const record = await this.db.getRepository('vscFileBlobs').findOne({
      filterByTk: blobHash,
      transaction,
    });

    if (!record) {
      throw new VscError('BLOB_NOT_FOUND', `Blob "${blobHash}" was not found`);
    }

    return {
      hash: record.get('hash') as string,
      size: record.get('size') as number,
      content: record.get('content') as string,
    };
  }
}

function comparableEntryFromTreeEntry(entry: VscNormalizedTreeEntry): ComparableFileEntry {
  return {
    path: entry.path,
    pathHash: entry.pathHash,
    blobHash: entry.blobHash,
    size: entry.size,
    language: entry.language,
    mode: entry.mode,
  };
}

function isUnchangedEntry(fromEntry: ComparableFileEntry, toEntry: ComparableFileEntry): boolean {
  return (
    fromEntry.blobHash === toEntry.blobHash &&
    fromEntry.language === toEntry.language &&
    fromEntry.mode === toEntry.mode
  );
}

function groupEntriesByBlobHash(entries: ComparableFileEntry[]): Map<string, ComparableFileEntry[]> {
  const grouped = new Map<string, ComparableFileEntry[]>();

  for (const entry of entries) {
    const current = grouped.get(entry.blobHash) || [];
    current.push(entry);
    grouped.set(entry.blobHash, current);
  }

  for (const current of grouped.values()) {
    current.sort(compareComparableEntries);
  }

  return grouped;
}

function compareComparableEntries(left: ComparableFileEntry, right: ComparableFileEntry): number {
  return left.path.localeCompare(right.path);
}

function compareFileDiffEntries(left: FileDiffEntry, right: FileDiffEntry): number {
  return (left.oldPath || left.path).localeCompare(right.oldPath || right.path);
}

function summarizeFileDiff(files: FileDiffEntry[]): FileDiffSummary {
  const summary: FileDiffSummary = {
    added: 0,
    modified: 0,
    deleted: 0,
    unchanged: 0,
    renamed: 0,
  };

  for (const file of files) {
    summary[file.status] += 1;
  }

  return summary;
}

function contentFromBlob(blob: VscStoredBlob): ResolvedContent {
  return {
    exists: true,
    size: blob.size,
    content: blob.content,
  };
}

function emptyContent(): ResolvedContent {
  return {
    exists: false,
    size: 0,
    content: '',
  };
}

function diffText(fromContent: string, toContent: string): TextDiffResult {
  if (fromContent === toContent) {
    return {
      tooLarge: false,
      additions: 0,
      deletions: 0,
      hunks: [],
    };
  }

  const fromLines = tokenizeLines(fromContent);
  const toLines = tokenizeLines(toContent);
  let prefixLength = 0;

  while (
    prefixLength < fromLines.length &&
    prefixLength < toLines.length &&
    isSameLineToken(fromLines[prefixLength], toLines[prefixLength])
  ) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  while (
    suffixLength < fromLines.length - prefixLength &&
    suffixLength < toLines.length - prefixLength &&
    isSameLineToken(fromLines[fromLines.length - suffixLength - 1], toLines[toLines.length - suffixLength - 1])
  ) {
    suffixLength += 1;
  }

  const deletedLines = fromLines.slice(prefixLength, fromLines.length - suffixLength);
  const insertedLines = toLines.slice(prefixLength, toLines.length - suffixLength);
  if (isLineDiffOverBudget(deletedLines.length, insertedLines.length, fromLines.length, toLines.length)) {
    return {
      tooLarge: true,
      hunks: [],
    };
  }

  const middleOperations = diffLineOperations(deletedLines, insertedLines);
  const lines: LineDiffLine[] = [];

  for (let index = 0; index < prefixLength; index += 1) {
    lines.push({
      type: 'context',
      content: fromLines[index].content,
      oldLineNumber: index + 1,
      newLineNumber: index + 1,
    });
  }

  let additions = 0;
  let deletions = 0;
  for (const operation of middleOperations) {
    if (operation.type === 'context') {
      const oldIndex = requiredLineIndex(operation.oldIndex);
      const newIndex = requiredLineIndex(operation.newIndex);
      lines.push({
        type: 'context',
        content: deletedLines[oldIndex].content,
        oldLineNumber: prefixLength + oldIndex + 1,
        newLineNumber: prefixLength + newIndex + 1,
      });
      continue;
    }
    if (operation.type === 'delete') {
      const oldIndex = requiredLineIndex(operation.oldIndex);
      deletions += 1;
      lines.push({
        type: 'delete',
        content: deletedLines[oldIndex].content,
        oldLineNumber: prefixLength + oldIndex + 1,
      });
      continue;
    }

    const newIndex = requiredLineIndex(operation.newIndex);
    additions += 1;
    lines.push({
      type: 'insert',
      content: insertedLines[newIndex].content,
      newLineNumber: prefixLength + newIndex + 1,
    });
  }

  for (let index = 0; index < suffixLength; index += 1) {
    const oldLineNumber = fromLines.length - suffixLength + index + 1;
    const newLineNumber = toLines.length - suffixLength + index + 1;
    lines.push({
      type: 'context',
      content: fromLines[fromLines.length - suffixLength + index].content,
      oldLineNumber,
      newLineNumber,
    });
  }

  return {
    tooLarge: false,
    additions,
    deletions,
    hunks: [
      {
        oldStart: 1,
        oldLines: fromLines.length,
        newStart: 1,
        newLines: toLines.length,
        lines,
      },
    ],
  };
}

function diffLineOperations(fromLines: LineToken[], toLines: LineToken[]): LineDiffOperation[] {
  if (fromLines.length === 0) {
    return toLines.map((line, index) => ({
      type: 'insert',
      newIndex: index,
    }));
  }
  if (toLines.length === 0) {
    return fromLines.map((line, index) => ({
      type: 'delete',
      oldIndex: index,
    }));
  }

  const table = buildLcsTable(fromLines, toLines);
  const operations: LineDiffOperation[] = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < fromLines.length && newIndex < toLines.length) {
    if (isSameLineToken(fromLines[oldIndex], toLines[newIndex])) {
      operations.push({
        type: 'context',
        oldIndex,
        newIndex,
      });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    if (lcsAt(table, oldIndex + 1, newIndex, toLines.length) >= lcsAt(table, oldIndex, newIndex + 1, toLines.length)) {
      operations.push({
        type: 'delete',
        oldIndex,
      });
      oldIndex += 1;
    } else {
      operations.push({
        type: 'insert',
        newIndex,
      });
      newIndex += 1;
    }
  }

  while (oldIndex < fromLines.length) {
    operations.push({
      type: 'delete',
      oldIndex,
    });
    oldIndex += 1;
  }
  while (newIndex < toLines.length) {
    operations.push({
      type: 'insert',
      newIndex,
    });
    newIndex += 1;
  }

  return operations;
}

function buildLcsTable(fromLines: LineToken[], toLines: LineToken[]): Uint32Array {
  const columnCount = toLines.length + 1;
  const table = new Uint32Array((fromLines.length + 1) * columnCount);

  for (let oldIndex = fromLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = toLines.length - 1; newIndex >= 0; newIndex -= 1) {
      const value = isSameLineToken(fromLines[oldIndex], toLines[newIndex])
        ? lcsAt(table, oldIndex + 1, newIndex + 1, toLines.length) + 1
        : Math.max(
            lcsAt(table, oldIndex + 1, newIndex, toLines.length),
            lcsAt(table, oldIndex, newIndex + 1, toLines.length),
          );
      table[tableIndex(oldIndex, newIndex, toLines.length)] = value;
    }
  }

  return table;
}

function lcsAt(table: Uint32Array, oldIndex: number, newIndex: number, toLineCount: number): number {
  return table[tableIndex(oldIndex, newIndex, toLineCount)];
}

function tableIndex(oldIndex: number, newIndex: number, toLineCount: number): number {
  return oldIndex * (toLineCount + 1) + newIndex;
}

function isLineDiffOverBudget(
  deletedLineCount: number,
  insertedLineCount: number,
  fromLineCount: number,
  toLineCount: number,
): boolean {
  if (fromLineCount + toLineCount > maxLineDiffLines) {
    return true;
  }

  return deletedLineCount * insertedLineCount > maxLineDiffComparisons;
}

function isSameLineToken(left: LineToken, right: LineToken): boolean {
  return left.content === right.content && left.terminated === right.terminated;
}

function requiredLineIndex(index: number | undefined): number {
  if (typeof index !== 'number') {
    throw new Error('Missing line diff index');
  }

  return index;
}

function tokenizeLines(content: string): LineToken[] {
  if (!content) {
    return [];
  }

  const parts = content.split('\n');
  const lines: LineToken[] = [];

  for (let index = 0; index < parts.length; index += 1) {
    const isLastPart = index === parts.length - 1;
    if (isLastPart && parts[index] === '') {
      continue;
    }

    lines.push({
      content: parts[index],
      terminated: !isLastPart,
    });
  }

  return lines;
}
