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
import { Field, FindOptions, Model } from '@nocobase/database';

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
          if (!collection) {
            app.log.warn(`Collection [${collectionName}] not exist. Skipping sequences refresh.`);
            return;
          }
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

          const sequencesFieldSet = _.uniq<string>(sequencesList.map(({ field }) => field));
          const primaryKeyFields = fields.filter((field) => field.options.primaryKey);
          const sortablePrimaryKeyFields = primaryKeyFields.filter(
            (field) => field.type === 'bigInt' || field.type === 'snowflakeId',
          );
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

            const selectedFields = _.uniq([
              field.name,
              ...primaryKeyFields.map((primaryKeyField) => primaryKeyField.name),
              ...(createAtField ? [createAtField.name] : []),
            ]);
            const latestRecordOrderField = createAtField ?? autoIncrementField;
            const latestRecordOrder: FindOptions['order'] = [
              [latestRecordOrderField.name, 'DESC'],
              ...sortablePrimaryKeyFields
                .filter((primaryKeyField) => primaryKeyField !== latestRecordOrderField)
                .map((primaryKeyField): [string, 'DESC'] => [primaryKeyField.name, 'DESC']),
            ];
            const latestRecordFilter = {
              [field.name]: { $ne: null },
              ...(createAtField ? { [createAtField.name]: { $ne: null } } : {}),
            };
            const chunkSize = 1000;
            const latestRecordQuery: FindOptions = {
              fields: selectedFields,
              filter: latestRecordFilter,
              order: latestRecordOrder,
            };
            latestRecordQuery['parseSort'] = false;
            const [latestCandidate] = await collection.repository.find({ ...latestRecordQuery, limit: 1 });
            let latestRecord =
              latestCandidate && field.match(latestCandidate.get(field.name)) ? latestCandidate : undefined;
            let offset = 1;

            while (!latestRecord && latestCandidate) {
              const records = await collection.repository.find({
                ...latestRecordQuery,
                limit: chunkSize,
                offset,
              });
              latestRecord = records.find((record) => field.match(record.get(field.name)));
              if (latestRecord || records.length < chunkSize) {
                break;
              }
              offset += chunkSize;
            }

            if (!latestRecord) {
              app.log.warn(
                `Collection [${collection.name}] field [${field.name}] has no valid sequence records. Skipping sequences repair.`,
              );
              continue;
            }

            const state = field.createRepairState();
            if (!createAtField) {
              field.collectRepairState(latestRecord, state);
              await field.saveRepairState(state);
              continue;
            }

            const latestCreatedAt = latestRecord.get(createAtField.name);
            if (!(latestCreatedAt instanceof Date) || Number.isNaN(latestCreatedAt.getTime())) {
              app.log.warn(
                `Collection [${collection.name}] field [${field.name}] latest record has an invalid createdAt. Skipping sequences repair.`,
              );
              continue;
            }

            const secondStart = new Date(Math.floor(latestCreatedAt.getTime() / 1000) * 1000);
            const secondEnd = new Date(secondStart.getTime() + 1000);
            const latestBatchQuery: FindOptions = {
              fields: selectedFields,
              filter: {
                [field.name]: { $ne: null },
                [createAtField.name]: {
                  $gte: secondStart,
                  $lt: secondEnd,
                },
              },
            };
            const collectRecords = async (records: Model[]) => {
              for (const record of records) {
                field.collectRepairState(record, state, createAtField.name);
              }
            };

            if (
              !app.db.inDialect('sqlite') &&
              primaryKeyFields.length &&
              primaryKeyFields.length === sortablePrimaryKeyFields.length
            ) {
              await collection.repository.chunkWithCursor({
                ...latestBatchQuery,
                chunkSize,
                callback: collectRecords,
              });
            } else {
              latestBatchQuery['parseSort'] = false;
              await collectRecords(await collection.repository.find(latestBatchQuery));
            }

            await field.saveRepairState(state);
          }
        });
      }
      await Promise.all(tasks.map((t) => t()));
      app.log.info(`app ${app.name} plugin ${this.name} finish repair data`);
    });
  }

  async install() {}
}
