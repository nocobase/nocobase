/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application } from '@nocobase/server';
import type { Model } from '@nocobase/database';
import type { CollectionRepository } from '@nocobase/plugin-data-source-main';
import { Op } from 'sequelize';
import { getFileKey } from '../utils';
import { AttachmentModel, StorageClassType, StorageModel } from '../storages';

export type RepairFilenameStatus = 'pending' | 'repaired' | 'skipped' | 'failed';

export interface RepairFilenameItem {
  collectionName: string;
  id: number | string;
  storageId: number | string;
  storageType: string;
  oldPath: string;
  oldFilename: string;
  newPath: string;
  newFilename: string;
  oldKey: string;
  newKey: string;
  sourceExists?: boolean;
  targetExists?: boolean;
  status: RepairFilenameStatus;
  reason?: string;
}

export interface RepairFilenamesOptions {
  apply?: boolean;
  batchSize?: number;
  limit?: number;
}

export interface RepairFilenamesResult {
  dryRun: boolean;
  scanned: number;
  candidates: RepairFilenameItem[];
  repaired: RepairFilenameItem[];
  skipped: RepairFilenameItem[];
  failed: RepairFilenameItem[];
}

interface FileManagerLike {
  storageTypes: {
    get(type: string): StorageClassType | undefined;
  };
  loadStorages(): Promise<void>;
  storagesCache: Map<number | string, StorageModel>;
}

function containsInvisibleChars(value?: string | null) {
  return Array.from(value || '').some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || (code >= 127 && code <= 159);
  });
}

export function replaceInvisibleChars(value?: string | null) {
  return Array.from(value || '')
    .map((char) => {
      const code = char.charCodeAt(0);
      return code <= 31 || (code >= 127 && code <= 159) ? '-' : char;
    })
    .join('');
}

export function getRepairedAttachmentValues(record: Pick<AttachmentModel, 'path' | 'filename'>) {
  return {
    path: replaceInvisibleChars(record.path),
    filename: replaceInvisibleChars(record.filename),
  };
}

function updateUrlValue(url: string | null | undefined, oldKey: string, newKey: string) {
  if (!url) {
    return url;
  }
  const encodedOldKey = oldKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const encodedNewKey = newKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return url.split(oldKey).join(newKey).split(encodedOldKey).join(encodedNewKey);
}

function formatItem(item: RepairFilenameItem) {
  return {
    collectionName: item.collectionName,
    id: item.id,
    storageId: item.storageId,
    storageType: item.storageType,
    oldKey: item.oldKey,
    newKey: item.newKey,
    sourceExists: item.sourceExists,
    targetExists: item.targetExists,
    status: item.status,
    reason: item.reason,
  };
}

async function getFileCollectionNames(app: Application) {
  const repository = (app.db.getRepository('collections') ||
    app.db.getCollection('collections')?.repository) as CollectionRepository;
  if (repository) {
    const collections: Model[] = await repository.find({
      filter: {
        'options.template': 'file',
      },
    });
    return Array.from(new Set(['attachments', ...collections.map((collection) => collection.get('name') as string)]));
  }
  return Array.from(
    new Set([
      'attachments',
      ...Array.from(app.db.collections.values())
        .filter((collection) => collection.options.template === 'file')
        .map((collection) => collection.name),
    ]),
  );
}

async function loadFileCollections(app: Application) {
  const collection = app.db.getCollection('collections');
  if (!collection) {
    return;
  }
  const repository = collection.repository as CollectionRepository;
  // Keep this aligned with core repair/db:sync commands so file collections
  // persisted in the collections table are available in app.db.collections.
  await repository.setApp?.(app);
  await repository.load?.();
}

async function repairCollectionAttachmentFilenames({
  app,
  fileManager,
  collectionName,
  result,
  apply,
  batchSize,
  limit,
}: {
  app: Application;
  fileManager: FileManagerLike;
  collectionName: string;
  result: RepairFilenamesResult;
  apply: boolean;
  batchSize: number;
  limit: number;
}) {
  const collection = app.db.getCollection(collectionName);
  if (!collection) {
    return;
  }
  const Model = collection.model;

  let lastId: number | string | null = null;
  while (result.scanned < limit) {
    const rows = await Model.findAll({
      attributes: ['id', 'path', 'filename', 'storageId', 'url'],
      where: lastId ? { id: { [Op.gt]: lastId } } : undefined,
      order: [['id', 'ASC']],
      limit: Math.min(batchSize, limit - result.scanned),
    });
    if (!rows.length) {
      break;
    }

    for (const row of rows) {
      result.scanned += 1;
      lastId = row.get('id') as number | string;

      const record = row.toJSON() as AttachmentModel;
      if (!containsInvisibleChars(record.path) && !containsInvisibleChars(record.filename)) {
        continue;
      }

      const storage = fileManager.storagesCache.get(record.storageId);
      const { path: newPath, filename: newFilename } = getRepairedAttachmentValues(record);
      const oldKey = getFileKey(record);
      const newRecord = { ...record, path: newPath, filename: newFilename };
      const newKey = getFileKey(newRecord);
      const item: RepairFilenameItem = {
        collectionName,
        id: lastId,
        storageId: record.storageId,
        storageType: storage?.type || '',
        oldPath: record.path || '',
        oldFilename: record.filename,
        newPath,
        newFilename,
        oldKey,
        newKey,
        status: 'pending',
      };
      result.candidates.push(item);

      if (!storage) {
        item.status = 'skipped';
        item.reason = 'storage_not_found';
        result.skipped.push(item);
        continue;
      }
      if (oldKey === newKey) {
        item.status = 'skipped';
        item.reason = 'unchanged';
        result.skipped.push(item);
        continue;
      }

      try {
        const StorageClass = fileManager.storageTypes.get(storage.type);
        if (!StorageClass) {
          item.status = 'skipped';
          item.reason = 'storage_type_not_found';
          result.skipped.push(item);
          continue;
        }
        const storageInstance = new StorageClass(storage);
        item.sourceExists = await storageInstance.exists(record);
        if (!item.sourceExists) {
          item.status = 'skipped';
          item.reason = 'source_not_found';
          result.skipped.push(item);
          continue;
        }

        item.targetExists = await storageInstance.exists(newRecord);
        if (item.targetExists) {
          item.status = 'skipped';
          item.reason = 'target_exists';
          result.skipped.push(item);
          continue;
        }

        if (apply) {
          await storageInstance.copy(record, newRecord);
          await row.update({
            path: newPath,
            filename: newFilename,
            url: updateUrlValue(record.url, oldKey, newKey),
          });
          try {
            const [deleted] = await storageInstance.delete([record]);
            if (!deleted) {
              item.reason = 'delete_old_failed';
            }
          } catch (error) {
            item.reason = `delete_old_failed: ${(error as Error).message}`;
          }
          item.status = 'repaired';
          result.repaired.push(item);
        }
      } catch (error) {
        item.status = 'failed';
        item.reason = (error as Error).message;
        result.failed.push(item);
      }
    }
  }
}

export async function repairAttachmentFilenames(
  app: Application,
  fileManager: FileManagerLike,
  options: RepairFilenamesOptions = {},
): Promise<RepairFilenamesResult> {
  const apply = !!options.apply;
  const batchSize = options.batchSize || 500;
  const limit = options.limit || Number.POSITIVE_INFINITY;
  const result: RepairFilenamesResult = {
    dryRun: !apply,
    scanned: 0,
    candidates: [],
    repaired: [],
    skipped: [],
    failed: [],
  };

  if (!fileManager.storagesCache.size) {
    await fileManager.loadStorages();
  }
  await loadFileCollections(app);

  for (const collectionName of await getFileCollectionNames(app)) {
    if (result.scanned >= limit) {
      break;
    }
    await repairCollectionAttachmentFilenames({
      app,
      fileManager,
      collectionName,
      result,
      apply,
      batchSize,
      limit,
    });
  }

  return result;
}

export function registerRepairFilenamesCommand(app: Application) {
  const command = (app.findCommand('file-manager') || app.command('file-manager')) as ReturnType<
    Application['command']
  >;
  command
    .command('repair-filenames')
    .preload()
    .option('--apply', 'rename objects and update attachment records')
    .option('--batch-size [batchSize]', 'batch size for scanning attachments')
    .option('--limit [limit]', 'maximum number of attachment records to scan')
    .action(async (options) => {
      const fileManager = app.pm.get('file-manager') as unknown as FileManagerLike;
      const result = await repairAttachmentFilenames(app, fileManager, {
        apply: !!options.apply,
        batchSize: options.batchSize ? Number(options.batchSize) : undefined,
        limit: options.limit ? Number(options.limit) : undefined,
      });

      console.log(
        JSON.stringify(
          {
            dryRun: result.dryRun,
            scanned: result.scanned,
            candidates: result.candidates.length,
            repaired: result.repaired.length,
            skipped: result.skipped.length,
            failed: result.failed.length,
          },
          null,
          2,
        ),
      );
      if (result.candidates.length) {
        console.table(result.candidates.map(formatItem));
      }
    });
}
