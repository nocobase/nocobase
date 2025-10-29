/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { decryptFieldKey, encryptFieldKey, loadPrimeKey } from '@nocobase/database';
import Application from '../application';

const REPL = require('repl');

/**
 * Key rotation
 *
 * this command use for rotating database encryption field key
 */
export default (app: Application) => {
  app
    .command('key-rotation')
    .option('--key-path <keyPath>')
    .preload()
    .action(async (options) => {
      console.log('Start rotating...', options.keyPath);
      if (!options.keyPath) {
        throw new Error('Key path is required');
      }
      const primeKey = loadPrimeKey();
      const extPrimeKey = loadPrimeKey(options.keyPath);
      const fieldList = await app.db.getRepository('fields').find({ filter: { type: 'encryption' } });
      const records = [];
      for (const field of fieldList) {
        const { primeKeyId, encryptedKey } = field.options ?? {};
        if (!primeKeyId || primeKeyId === primeKey.id) {
          continue;
        }
        if (primeKeyId !== extPrimeKey.id) {
          throw new Error(`Key id not match: ${primeKeyId}`);
        }
        const fieldKey = await decryptFieldKey(encryptedKey, extPrimeKey);
        const { id, encrypted } = await encryptFieldKey(fieldKey, primeKey);
        records.push({
          key: field.key,
          options: {
            ...field.options,
            primeKeyId: id,
            encryptedKey: encrypted,
          },
        });
      }
      await app.db.getRepository('fields').updateMany({ records });
    });
};
