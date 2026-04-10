/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JOB_STATUS, JobModel } from '@nocobase/plugin-workflow';
import { AIEmployeeInstructionFiles } from './types';
import Database from '@nocobase/database';
import _ from 'lodash';

export abstract class Files {
  static resolvers(db: Database, job: JobModel, attachmentPart: Record<string, any>) {
    const resolveAttachments = async (files: AIEmployeeInstructionFiles[]) => {
      const attachments = files.filter((it) => it.type === 'file_id');
      if (attachments.length) {
        const attachmentGroup = _.groupBy(attachments, (it) => it.collection);
        for (const collection of _.uniq(attachments.map((it) => it.collection))) {
          const repository = db.getRepository(collection as string);
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
          attachmentPart.attachments = attachmentModels.map((it: any) => it.toJSON());
        }
      }
    };

    const resolveUrls = async (files: AIEmployeeInstructionFiles[]) => {
      const urls = files.filter((it) => it.type === 'file_url');
      if (urls.length) {
        attachmentPart.attachments = urls;
      }
    };

    return {
      resolveAttachments,
      resolveUrls,
    };
  }
}
