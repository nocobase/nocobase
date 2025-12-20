/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { randomInt } from 'crypto';
import path from 'path';
import { promisify } from 'util';

import { Plugin } from '@nocobase/server';
import { Registry } from '@nocobase/utils';
import { Pattern, SequenceField } from './fields/sequence-field';
import _ from 'lodash';
import { Field, Model } from '@nocobase/database';

const asyncRandomInt = promisify(randomInt);

export default class PluginFieldSequenceServer extends Plugin {
  patternTypes = new Registry<Pattern>();

  async load() {
    const { app, db, options } = this;

    db.registerFieldTypes({
      sequence: SequenceField,
    });

    db.addMigrations({
      namespace: 'sequence-field',
      directory: path.resolve(__dirname, 'migrations'),
      context: {
        plugin: this,
      },
    });

    await this.importCollections(path.resolve(__dirname, 'collections'));

    db.on('fields.beforeSave', async (field, { transaction }) => {
      if (field.get('type') !== 'sequence') {
        return;
      }
      const patterns = (field.get('patterns') || []).filter((p) => p.type === 'integer');
      if (!patterns.length) {
        return;
      }

      const SequenceRepo = db.getRepository('sequences');
      await patterns.reduce(
        (promise: Promise<any>, p) =>
          promise.then(async () => {
            if (p.options?.key == null) {
              Object.assign(p, {
                options: {
                  ...p.options,
                  key: await asyncRandomInt(1 << 16),
                },
              });
            }
          }),
        Promise.resolve(),
      );
      const sequences = await SequenceRepo.find({
        filter: {
          field: field.get('name'),
          collection: field.get('collectionName'),
          key: patterns.map((p) => p.options.key),
        },
        transaction,
      });
      await patterns.reduce(
        (promise: Promise<any>, p) =>
          promise.then(async () => {
            if (!sequences.find((s) => s.get('key') === p.options.key)) {
              await SequenceRepo.create({
                values: {
                  field: field.get('name'),
                  collection: field.get('collectionName'),
                  key: p.options.key,
                },
                transaction,
              });
              await field.load({ transaction });
            }
          }),
        Promise.resolve(),
      );
    });

    db.on('fields.afterDestroy', async (field, { transaction }) => {
      if (field.get('type') !== 'sequence') {
        return;
      }

      const patterns = (field.get('patterns') || []).filter((p) => p.type === 'integer');
      if (!patterns.length) {
        return;
      }

      const SequenceRepo = db.getRepository('sequences');
      await SequenceRepo.destroy({
        filter: {
          field: field.get('name'),
          collection: field.get('collectionName'),
          key: patterns.map((p) => p.key),
        },
        transaction,
      });
    });

    app.on('repair', async () => {
      app.log.info(`app ${app.name} plugin ${this.name} start repair data...`);
      const sequencesModel = app.db.getModel('sequences');
      const allSequences = await sequencesModel.findAll();
      const groupedSequences = _.groupBy(allSequences, 'collection');

      const tasks: (() => Promise<void>)[] = [];
      for (const [collectionName, sequencesList] of Object.entries(groupedSequences)) {
        tasks.push(async () => {
          const collection = app.db.getCollection(collectionName);
          const fields: Field[] = collection.getFields();
          const fieldMap = Object.fromEntries<Field>(fields.map((field) => [field.name, field]));

          const [autoIncrementField] = fields.filter((field) => field.options.primaryKey && field.type === 'bigInt');
          const [createAtField] = fields.filter((field) => field.options.interface === 'createdAt');
          if (!autoIncrementField && !createAtField) {
            app.log.warn(
              `Collection [${collection.name}] does not have autoIncrement or createdAt fields. Skipping sequences refresh.`,
            );
            return;
          }

          const [record] = await collection.model.findAll({
            order: [[autoIncrementField?.name ?? createAtField?.name, 'DESC']],
            limit: 1,
          });
          if (!record) {
            app.log.warn(`Collection [${collection.name}] has no records. Skipping sequences repair.`);
            return;
          }

          const sequencesFieldSet = _.uniq<string>(sequencesList.map(({ field }) => field));
          for (const sequencesField of sequencesFieldSet) {
            const field = fieldMap[sequencesField];
            app.log.info(
              `Repair sequences: collection=${collection.name}, field=${sequencesField}, type=${field?.constructor?.name}`,
            );

            if (!field) {
              app.log.warn(
                `Collection [${collection.name}] field [${sequencesField}] definition not found. Skipping sequences repair.`,
              );
              continue;
            }

            if (!(field instanceof SequenceField)) {
              app.log.warn(
                `Collection [${collection.name}] field [${sequencesField}] is not a SequenceField. Skipping sequences repair.`,
              );
              continue;
            }

            await (field as SequenceField).update(record, { overwrite: true });
          }
        });
      }
      await Promise.all(tasks.map((t) => t()));
      app.log.info(`app ${app.name} plugin ${this.name} finish repair data`);
    });
  }

  async install() {}
}
