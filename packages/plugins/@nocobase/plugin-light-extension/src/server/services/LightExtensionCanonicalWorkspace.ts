/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { isVscError, TreeService, type PreparedTree } from '@nocobase/plugin-vsc-file';

import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionWorkspacePreviewFile } from '../../shared/types';

export interface CanonicalPreviewWorkspaceFile {
  readonly path: string;
  readonly pathHash: string;
  readonly pathLowerHash: string;
  readonly blobHash: string;
  readonly size: number;
  readonly language: string;
  readonly mode: string;
  readonly content: string;
}

export interface CanonicalPreviewWorkspace {
  readonly workspaceDigest: string;
  readonly treeHash: string;
  readonly entryCount: number;
  readonly byteSize: number;
  readonly files: readonly CanonicalPreviewWorkspaceFile[];
}

/** Uses the VSC PreparedTree pipeline, so preview and Save share path, text, metadata, hash, and size semantics. */
export class LightExtensionCanonicalWorkspaceBuilder {
  private readonly treeService: TreeService;

  constructor(db: Database, treeService?: TreeService) {
    this.treeService = treeService || new TreeService(db);
  }

  async build(files: readonly LightExtensionWorkspacePreviewFile[]): Promise<CanonicalPreviewWorkspace> {
    let preparedTree: PreparedTree;
    try {
      preparedTree = await this.treeService.prepareTree(files);
    } catch (error) {
      if (!isVscError(error)) {
        throw error;
      }
      throw new LightExtensionError(
        'LIGHT_EXTENSION_VALIDATION_FAILED',
        'Light extension preview workspace cannot be canonicalized',
        {
          status: 422,
          details: {
            sourceCode: error.code,
          },
        },
      );
    }

    const contentByHash = new Map(preparedTree.canonicalBlobs.map((blob) => [blob.hash, blob.content] as const));
    const canonicalFiles = preparedTree.entries.map((entry): CanonicalPreviewWorkspaceFile => {
      const content = contentByHash.get(entry.blobHash);
      if (typeof content !== 'string') {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_SOURCE_ERROR',
          'Canonical preview workspace content is incomplete',
        );
      }
      return Object.freeze({ ...entry, content });
    });

    return Object.freeze({
      workspaceDigest: preparedTree.hash,
      treeHash: preparedTree.hash,
      entryCount: preparedTree.entryCount,
      byteSize: preparedTree.byteSize,
      files: Object.freeze(canonicalFiles),
    });
  }
}
