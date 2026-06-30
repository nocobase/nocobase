/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Model, Repository } from '@nocobase/database';
import { CollectionRepository } from '@nocobase/plugin-data-source-main';
import { Migration } from '@nocobase/server';

function normalizeAttachmentUiSchema(uiSchema = {}) {
  return {
    type: 'array',
    ...uiSchema,
    'x-component': uiSchema['x-component'] || 'Upload.Attachment',
    'x-use-component-props': uiSchema['x-use-component-props'] || 'useAttachmentFieldProps',
  };
}

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const FieldRepo = this.db.getRepository<Repository>('fields');
    const CollectionRepo = this.db.getRepository('collections') as CollectionRepository;
    const collectionNames = new Set<string>();

    await this.db.sequelize.transaction(async (transaction) => {
      const fields = (await FieldRepo.find({
        filter: {
          type: 'belongsToMany',
          interface: 'attachment',
        },
        transaction,
      })) as Model[];

      for (const field of fields) {
        const uiSchema = normalizeAttachmentUiSchema(field.get('uiSchema'));

        field.set('interface', 'm2m');
        field.set('target', 'attachments');
        field.set('uiSchema', uiSchema);
        field.changed('options', true);
        await field.save({ transaction });

        collectionNames.add(field.get('collectionName'));
      }
    });

    for (const collectionName of collectionNames) {
      await CollectionRepo.load({
        filter: {
          name: collectionName,
        },
      });
    }
  }
}
