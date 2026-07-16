/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Model } from '@nocobase/database';
import type { AttachmentModel } from '@nocobase/plugin-file-manager';

export type AttachmentId = string | number;

export type AttachmentSource = {
  dataSourceKey?: string;
  collectionName?: string;
  field?: string;
  documentCache?: boolean;
  trustworthy?: boolean;
};

type AttachmentLookup = {
  id: AttachmentId;
  source: AttachmentSource;
};

const AI_FILES_ATTACHMENT_SOURCE = {
  dataSourceKey: 'main',
  collectionName: 'aiFiles',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function appendSourceToAttachmentRecord(record: unknown) {
  if (!isRecord(record)) {
    return;
  }
  const meta = {
    ...(isRecord(record.meta) ? record.meta : {}),
    source: AI_FILES_ATTACHMENT_SOURCE,
  };
  if (typeof record.set === 'function') {
    const model = record as Model;
    model.set('meta', meta);
    model.dataValues.meta = meta;
    return;
  }
  record.meta = meta;
}

export function appendAIFileAttachmentSource(body: unknown) {
  if (!isRecord(body)) {
    return;
  }
  if (body.data) {
    appendSourceToAttachmentRecord(body.data);
    return;
  }
  appendSourceToAttachmentRecord(body);
}

export function getAttachmentId(attachment: unknown): AttachmentId | null {
  if (!isRecord(attachment)) {
    return null;
  }
  const id = attachment.id ?? attachment.filterByTk;
  if (typeof id === 'string' || typeof id === 'number') {
    return id;
  }
  return null;
}

export function shouldSkipAttachmentSourceLookup(source: AttachmentSource | null) {
  return source?.trustworthy === true;
}

export function getAttachmentSource(attachment: unknown): AttachmentSource | null {
  if (!isRecord(attachment) || !isRecord(attachment.source)) {
    return null;
  }
  const { dataSourceKey, collectionName, field, documentCache, trustworthy } = attachment.source;
  const source = {
    dataSourceKey: typeof dataSourceKey === 'string' && dataSourceKey ? dataSourceKey : 'main',
    ...(typeof collectionName === 'string' && collectionName ? { collectionName } : {}),
    ...(typeof field === 'string' ? { field } : {}),
    ...(typeof documentCache === 'boolean' ? { documentCache } : {}),
    ...(trustworthy === true ? { trustworthy } : {}),
  };
  if (!source.trustworthy && !source.collectionName) {
    return null;
  }
  return source;
}

function getSourceDatabase(ctx: Context, dataSourceKey?: string): Database | null {
  if (!dataSourceKey || dataSourceKey === 'main') {
    return ctx.db;
  }
  const dataSource = ctx.app.dataSourceManager?.dataSources?.get(dataSourceKey);
  return dataSource?.collectionManager?.db ?? null;
}

function getLookupKey(lookup: AttachmentLookup) {
  const dataSourceKey = lookup.source.dataSourceKey || 'main';
  const collectionName = lookup.source.collectionName;
  return `${dataSourceKey}:${collectionName}:${lookup.id}`;
}

function isValidFileCollectionSource(db: Database, lookup: AttachmentLookup) {
  const collectionName = lookup.source.collectionName;
  const collection = db.getCollection(collectionName);
  if (collection?.options?.template !== 'file') {
    return false;
  }
  if (collectionName === 'aiFiles') {
    return true;
  }
  if (!lookup.source.field) {
    return false;
  }
  return db.getFieldByPath(lookup.source.field)?.options?.target === collectionName;
}

async function findSourceAttachments(ctx: Context, lookups: AttachmentLookup[]) {
  const attachmentsByLookup = new Map<string, AttachmentModel>();
  const groups = new Map<string, AttachmentLookup[]>();
  for (const lookup of lookups) {
    const dataSourceKey = lookup.source.dataSourceKey || 'main';
    const collectionName = lookup.source.collectionName;
    const groupKey = `${dataSourceKey}:${collectionName}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), lookup]);
  }

  for (const [groupKey, groupLookups] of groups.entries()) {
    const [dataSourceKey, collectionName] = groupKey.split(':');
    const db = getSourceDatabase(ctx, dataSourceKey);
    if (!db) {
      continue;
    }
    const validLookups = groupLookups.filter((lookup) => isValidFileCollectionSource(db, lookup));
    if (!validLookups.length) {
      continue;
    }

    const filter: Record<string, unknown> = {
      id: {
        $in: [...new Set(validLookups.map((lookup) => lookup.id))],
      },
    };
    if (collectionName === 'aiFiles') {
      filter.createdById = ctx.auth?.user.id;
    }

    const records = await db.getRepository(collectionName).find({ filter });
    for (const record of records) {
      const attachment = record.toJSON() as AttachmentModel;
      attachmentsByLookup.set(`${dataSourceKey}:${collectionName}:${attachment.id}`, attachment);
    }
  }

  return attachmentsByLookup;
}

export async function findMessageAttachments(ctx: Context, attachments: unknown[]) {
  const lookups: AttachmentLookup[] = [];
  for (const attachment of attachments) {
    const source = getAttachmentSource(attachment);
    if (!source || shouldSkipAttachmentSourceLookup(source)) {
      continue;
    }
    const id = getAttachmentId(attachment);
    if (id == null) {
      continue;
    }
    lookups.push({
      id,
      source,
    });
  }

  return findSourceAttachments(ctx, lookups);
}

export function getMessageAttachmentLookupKey(attachment: unknown) {
  const source = getAttachmentSource(attachment);
  if (!source || shouldSkipAttachmentSourceLookup(source)) {
    return null;
  }
  const id = getAttachmentId(attachment);
  if (id == null) {
    return null;
  }
  return getLookupKey({
    id,
    source,
  });
}
