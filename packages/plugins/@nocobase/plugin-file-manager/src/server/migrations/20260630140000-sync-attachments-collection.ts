/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, CollectionOptions, FieldOptions, Model } from '@nocobase/database';
import { CollectionRepository } from '@nocobase/plugin-data-source-main';
import { Migration } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import attachmentsCollection from '../../common/collections/attachments';

type FieldOptionsWithName = FieldOptions & { name: string; key?: string; sort?: number };

function getAttachmentFieldOptions(collection: Collection): FieldOptionsWithName[] {
  const fields = new Map<string, FieldOptionsWithName>();
  const declaredFields = (attachmentsCollection as CollectionOptions).fields || [];

  for (const [index, field] of declaredFields.entries()) {
    if (field.name) {
      fields.set(field.name, {
        ...field,
        sort: index + 1,
      } as FieldOptionsWithName);
    }
  }

  for (const [name, field] of collection.fields.entries()) {
    if (!fields.has(name)) {
      fields.set(name, {
        name,
        ...field.options,
        sort: fields.size + 1,
      });
    }
  }

  return [...fields.values()];
}

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    const collection = this.db.getCollection('attachments');
    if (!collection) {
      return;
    }

    const CollectionRepo = this.db.getRepository('collections') as CollectionRepository;
    const FieldRepo = this.db.getRepository('fields');
    const { fields: _runtimeFields, ...runtimeCollectionOptions } = collection.options;
    const { fields: _declaredFields, ...declaredCollectionOptions } = attachmentsCollection as CollectionOptions;
    const collectionOptions = {
      ...runtimeCollectionOptions,
      ...declaredCollectionOptions,
    };
    const fields = getAttachmentFieldOptions(collection);

    await this.db.sequelize.transaction(async (transaction) => {
      const existingCollection = await CollectionRepo.findOne({
        filter: {
          name: 'attachments',
        },
        transaction,
      });

      if (existingCollection) {
        await CollectionRepo.update({
          filterByTk: 'attachments',
          values: {
            ...collectionOptions,
            sort: existingCollection.get('sort') ?? 1,
            from: existingCollection.get('from') || 'db2cm',
          },
          transaction,
        });
      } else {
        await CollectionRepo.create({
          values: {
            ...collectionOptions,
            key: collectionOptions.key || uid(),
            sort: 1,
            from: 'db2cm',
          },
          transaction,
          hooks: false,
        });
      }

      const existingFields = (await FieldRepo.find({
        filter: {
          collectionName: 'attachments',
        },
        transaction,
      })) as Model[];
      const existingFieldsMap = new Map(existingFields.map((field) => [field.get('name'), field]));
      const missingFields = [];

      for (const field of fields) {
        const existingField = existingFieldsMap.get(field.name);
        const { key, ...fieldValues } = field;

        if (existingField) {
          await FieldRepo.update({
            filterByTk: existingField.get('key'),
            values: {
              ...fieldValues,
              sort: existingField.get('sort') ?? fieldValues.sort,
              collectionName: 'attachments',
            },
            transaction,
            hooks: false,
          });
        } else {
          missingFields.push({
            ...fieldValues,
            key: key || uid(),
            collectionName: 'attachments',
          });
        }
      }

      if (missingFields.length) {
        await FieldRepo.create({
          values: missingFields,
          transaction,
          hooks: false,
        });
      }
    });

    await CollectionRepo.load({
      filter: {
        name: 'attachments',
      },
    });
  }
}
