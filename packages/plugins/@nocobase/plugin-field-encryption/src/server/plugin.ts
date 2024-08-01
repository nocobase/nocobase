/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import PluginErrorHandler from '@nocobase/plugin-error-handler';
import { EncryptionField } from './encryption-field';
import { $encryptionEq } from './operators/eq';
import { $encryptionNe } from './operators/ne';
import { checkKey } from './utils';
import { EncryptionError } from './errors/EncryptionError';

export class PluginFieldEncryptionServer extends Plugin {
  async load() {
    this.db.registerFieldTypes({
      encryption: EncryptionField,
    });

    this.db.registerOperators({
      $encryptionEq,
      $encryptionNe,
    });

    this.db.on('fields.beforeCreate', (model, field) => {
      if (model.type === 'encryption') {
        checkKey();
      }
    });

    const errorHandlerPlugin = this.app.getPlugin<PluginErrorHandler>('error-handler');
    errorHandlerPlugin.errorHandler.register(
      (err) => {
        return err instanceof EncryptionError;
      },
      (err, ctx) => {
        ctx.status = 400;
        ctx.body = {
          errors: [
            {
              message: ctx.t(err.message, { ns: 'field-encryption' }),
            },
          ],
        };
      },
    );
  }
}

export default PluginFieldEncryptionServer;
