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
import { $encryptionEq } from './operators/eq';
import { $encryptionNe } from './operators/ne';
import { EncryptionError } from '@nocobase/database';

export class PluginFieldEncryptionServer extends Plugin {
  async load() {
    this.db.registerOperators({
      $encryptionEq,
      $encryptionNe,
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
