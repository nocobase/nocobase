/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PublishArtifactMeta, PublishArtifactService, PublishArtifactType } from '../publish-artifact-service';

export type PublishAdapterAction = 'generate' | 'upload' | 'execute';

export interface PublishAdapterCapabilities {
  generate: boolean;
  upload: boolean;
  execute: boolean;
  executeOptions?: string[];
  unavailableReason?: string;
}

export interface PublishAdapterContext {
  ctx: any;
  artifactService: PublishArtifactService;
  createdById?: number;
}

export interface PublishGenerateResult {
  meta: PublishArtifactMeta;
  filePath: string;
}

export interface PublishAdapter {
  type: PublishArtifactType;
  capabilities(): PublishAdapterCapabilities;
  generate(context: PublishAdapterContext, options: Record<string, any>): Promise<PublishGenerateResult>;
  validateUpload(
    context: PublishAdapterContext,
    meta: PublishArtifactMeta,
    options?: Record<string, any>,
  ): Promise<PublishArtifactMeta>;
  execute(
    context: PublishAdapterContext,
    meta: PublishArtifactMeta,
    options: Record<string, any>,
  ): Promise<PublishArtifactMeta>;
}
