/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { randomUUID } from 'crypto';

import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type { LightExtensionPublicationMetadataRecord } from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { LightExtensionPermissionService } from './LightExtensionPermissionService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import {
  LightExtensionPublicationRecord,
  publicationFromModel,
  toPublicationMetadata,
} from './LightExtensionPublicationService';

export class LightExtensionPublicationResolveService {
  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly permissionService: LightExtensionPermissionService,
  ) {}

  async getMetadata(
    publicationId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPublicationMetadataRecord> {
    return toPublicationMetadata(await this.getPublication(publicationId, ctx));
  }

  async listMetadataByRepo(
    repoId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPublicationMetadataRecord[]> {
    const requestId = ctx.requestId || randomUUID();
    try {
      await this.permissionService.assertActionAllowed({
        action: 'readPublication',
        ctx,
      });
    } catch (error) {
      await this.recordReadDenied(`repo:${repoId}`, { ...ctx, requestId }, error);
      throw error;
    }

    const records = await this.db.getRepository('lightExtensionEntryPublications').find({
      filter: {
        repoId,
      },
      sort: ['entryId', '-createdAt'],
      transaction: ctx.transaction,
    });

    return records.map((record: Model) => toPublicationMetadata(publicationFromModel(record)));
  }

  async getPublication(
    publicationId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPublicationRecord> {
    const requestId = ctx.requestId || randomUUID();
    try {
      await this.permissionService.assertActionAllowed({
        action: 'readPublication',
        ctx,
      });
    } catch (error) {
      await this.recordReadDenied(publicationId, { ...ctx, requestId }, error);
      throw error;
    }

    const record = await this.db.getRepository('lightExtensionEntryPublications').findOne({
      filterByTk: publicationId,
      transaction: ctx.transaction,
    });
    if (!record) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND',
        `Light extension publication "${publicationId}" was not found`,
      );
    }

    return publicationFromModel(record);
  }

  private async recordReadDenied(
    publicationId: string,
    ctx: LightExtensionServiceContext,
    error: unknown,
  ): Promise<void> {
    if (!isLightExtensionError(error)) {
      return;
    }

    try {
      await this.auditService.recordPublicationReadDenied({
        publicationId,
        requestId: ctx.requestId || randomUUID(),
        actorUserId: ctx.actorUserId,
        reasonCode: error.code,
        requestSource: ctx.requestSource,
        transaction: ctx.transaction,
      });
    } catch {
      // Denial must not depend on audit persistence availability.
    }
  }
}
