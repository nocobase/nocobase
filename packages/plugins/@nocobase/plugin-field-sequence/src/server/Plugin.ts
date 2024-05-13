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
  }

  async install() {}
}
