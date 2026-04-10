/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Application from '@nocobase/server';
import PluginAPIKeysServer from '../plugin';

export default function generateAPIKeyCommand(app: Application) {
  app
    .command('generate-api-key')
    .preload()
    .requiredOption('-n, --name <name>', 'The name of the API key')
    .requiredOption('-r, --role <roleName>', 'The role of the API key')
    .requiredOption('-u, --username <username>', 'The username of the API key')
    .option('-e, --expires-in [expiresIn]', 'The expiration time of the API key', '30d')
    .action(async (options) => {
      const plugin = app.pm.get<PluginAPIKeysServer>('api-keys');
      const token = await plugin.generateAPIKey(options);
      console.log('-----BEGIN API KEY-----');
      console.log(token);
      console.log('-----END API KEY-----');
    });
}
