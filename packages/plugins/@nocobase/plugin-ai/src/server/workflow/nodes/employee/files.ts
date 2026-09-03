/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AIEmployeeInstructionFiles } from './types';
import _ from 'lodash';
import axios from 'axios';
import { parsePermanentFileReference, type PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import { Plugin } from '@nocobase/server';
import { resolveContentType, resolveFileIdentity } from '../../utils';
import { getAttachmentSource, type AttachmentSource } from '../../../attachments';

function appendSource(record: unknown, source: AttachmentSource) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return record;
  }
  return {
    ...record,
    source,
  };
}

type FileRecord = Record<string, unknown> & {
  toJSON?: () => unknown;
};

function toFilePlainObject(record: FileRecord) {
  const value = typeof record.toJSON === 'function' ? record.toJSON() : record;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid file record');
  }
  return value as Record<string, unknown>;
}

async function resolveInternalFileURL(plugin: Plugin, url: string, origin?: string) {
  const reference = parsePermanentFileReference(url, origin);
  if (!reference) {
    return null;
  }
  if (reference.appName !== (plugin.app.name || 'main')) {
    throw new Error('File not found');
  }

  const dataSource = plugin.app.dataSourceManager.get(reference.dataSourceKey);
  const collection = dataSource?.collectionManager.getCollection(reference.collectionName);
  if (!dataSource || !collection || (collection.name !== 'attachments' && collection.options?.template !== 'file')) {
    throw new Error('File not found');
  }

  const record = (await dataSource.collectionManager.getRepository(collection.name).findOne({
    filter: { id: reference.id },
  })) as FileRecord | null;
  if (!record) {
    throw new Error('File not found');
  }
  const file = toFilePlainObject(record);
  if (file.storageId == null || (reference.extname && reference.extname !== file.extname)) {
    throw new Error('File not found');
  }

  return appendSource(file, {
    dataSourceKey: reference.dataSourceKey,
    collectionName: collection.name,
    trustworthy: true,
  });
}

export abstract class Files {
  static resolvers(plugin: Plugin, attachmentPart: { attachments?: unknown[] }, fileUrlOrigin?: string) {
    const resolveAttachments = async (files: AIEmployeeInstructionFiles[]) => {
      const attachments = files
        .filter((it) => it.type === 'attachments')
        .flatMap((it) => (_.isArray(it.value) ? it.value : [it.value]))
        .map((attachment) =>
          appendSource(attachment, {
            ...(getAttachmentSource(attachment) ?? {}),
            trustworthy: true,
          }),
        );
      if (attachments.length) {
        attachmentPart.attachments = [...(attachmentPart.attachments ?? []), ...attachments];
      }
    };

    const resolveFileIds = async (files: AIEmployeeInstructionFiles[]) => {
      const attachments = files.filter((it) => it.type === 'file_id');
      if (attachments.length) {
        const attachmentGroup = _.groupBy(attachments, (it) => it.collection);
        for (const collection of _.uniq(attachments.map((it) => it.collection))) {
          const repository = plugin.db.getRepository(collection as string);
          if (!repository) {
            throw new Error(`Attachment collection [${collection}] not existed`);
          }
          const attachmentKeys = attachmentGroup[collection as string]?.flatMap((it) =>
            _.isArray(it.value) ? it.value : [it.value],
          );
          const attachmentModels = await repository.find({
            filter: {
              id: {
                $in: attachmentKeys,
              },
            },
          });
          if (!attachmentModels.length) {
            throw new Error(`Attachment [${collection}] record not existed. Keys: [${attachmentKeys.join(',')}]`);
          }
          attachmentPart.attachments = [
            ...(attachmentPart.attachments ?? []),
            ...attachmentModels.map((it: { toJSON: () => unknown }) =>
              appendSource(it.toJSON(), {
                dataSourceKey: 'main',
                collectionName: collection as string,
                trustworthy: true,
              }),
            ),
          ];
        }
      }
    };

    const resolveUrls = async (files: AIEmployeeInstructionFiles[]) => {
      const attachmentFiles = files.filter((it) => it.type === 'file_url');
      if (attachmentFiles.length) {
        const urls = attachmentFiles.flatMap(({ value }) => (_.isArray(value) ? value : [value]));
        const fileManager = plugin.pm.get('file-manager') as PluginFileManagerServer;
        const settings = await plugin.db.getRepository('aiSettings').findOne();
        const storageName = settings?.options?.storage;
        const attachments = await Promise.all(
          urls.map(async (url) => {
            const internalFile = await resolveInternalFileURL(plugin, url, fileUrlOrigin);
            if (internalFile) {
              return internalFile;
            }
            try {
              new URL(url);
            } catch (error) {
              throw new Error(`File URL must be an absolute URL or a NocoBase permanent file URL: ${url}`);
            }
            const response = await axios.get(url, {
              responseType: 'arraybuffer',
            });
            const contentType = resolveContentType(response.headers);
            const fileIdentity = resolveFileIdentity(url, response.headers);
            const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${_.random(1_000_000_000)}`);

            await fs.writeFile(tempFilePath, response.data);

            try {
              const created = await fileManager.createFileRecord({
                collectionName: 'aiFiles',
                filePath: tempFilePath,
                storageName,
                values: {
                  title: fileIdentity.title,
                  mimetype: contentType,
                  meta: {
                    sourceUrl: url,
                    originalFilename: fileIdentity.filename,
                  },
                },
              });
              return appendSource(created.toJSON(), {
                dataSourceKey: 'main',
                collectionName: 'aiFiles',
                trustworthy: true,
              });
            } finally {
              await fs.rm(tempFilePath, { force: true });
            }
          }),
        );
        attachmentPart.attachments = [...(attachmentPart.attachments ?? []), ...attachments];
      }
    };

    return {
      resolveAttachments,
      resolveFileIds,
      resolveUrls,
    };
  }
}
