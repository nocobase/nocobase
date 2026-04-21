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
import { JOB_STATUS, JobModel } from '@nocobase/plugin-workflow';
import { AIEmployeeInstructionFiles } from './types';
import _ from 'lodash';
import axios from 'axios';
import PluginFileManagerServer from '@nocobase/plugin-file-manager';
import { Plugin } from '@nocobase/server';
import { resolveContentType, resolveFileIdentity } from '../../utils';

export abstract class Files {
  static resolvers(plugin: Plugin, job: JobModel, attachmentPart: Record<string, any>) {
    const resolveAttachments = async (files: AIEmployeeInstructionFiles[]) => {
      const attachments = files.filter((it) => it.type === 'file_id');
      if (attachments.length) {
        const attachmentGroup = _.groupBy(attachments, (it) => it.collection);
        for (const collection of _.uniq(attachments.map((it) => it.collection))) {
          const repository = plugin.db.getRepository(collection as string);
          if (!repository) {
            job.set({
              status: JOB_STATUS.ERROR,
              result: `Attachment collection [${collection}] not existed`,
            });
            return;
          }
          const attachmentKeys = attachmentGroup[collection as string]?.map((it) => it.value);
          const attachmentModels = await repository.find({
            filter: {
              id: {
                $in: attachmentKeys,
              },
            },
          });
          if (!attachmentModels.length) {
            job.set({
              status: JOB_STATUS.ERROR,
              result: `Attachment [${collection}] record not existed. Keys: [${attachmentKeys.join(',')}]`,
            });
            return;
          }
          attachmentPart.attachments = [
            ...(attachmentPart.attachments ?? []),
            ...attachmentModels.map((it: any) => it.toJSON()),
          ];
        }
      }
    };

    const resolveUrls = async (files: AIEmployeeInstructionFiles[]) => {
      const urls = files.filter((it) => it.type === 'file_url');
      if (urls.length) {
        const fileManager = plugin.pm.get('file-manager') as PluginFileManagerServer;
        const settings = await plugin.db.getRepository('aiSettings').findOne();
        const storageName = settings?.options?.storage;
        const attachments = await Promise.all(
          urls.map(async ({ value: url }) => {
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
                  ...fileIdentity,
                  mimetype: contentType,
                  meta: {
                    sourceUrl: url,
                  },
                },
              });
              return created.toJSON();
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
      resolveUrls,
    };
  }
}
