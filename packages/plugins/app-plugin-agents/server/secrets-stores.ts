/**
 * Where the plugin keeps sealed values: variables (`agSecrets`) and model service keys (`agModelServices`), for
 * `nocobase secrets status` and `secrets rotate`.
 */
import {
  createSecretsTableStore,
  type SecretsStore,
} from '@nocobase/app-server/secrets';
import type { DatabaseConnection } from '@nocobase/db';

import { ACCESS_NAMESPACE } from '../shared/access.js';
import { variableAad } from './core/variables/index.js';
import {
  MODEL_SERVICE_KEY_SECRET_PURPOSE,
  VARIABLES_SECRET_PURPOSE,
} from './kernel/secrets.js';

export function createAgentsSecretsStores(
  connection: () => DatabaseConnection,
): SecretsStore[] {
  return [
    createSecretsTableStore({
      name: `${ACCESS_NAMESPACE}/variables`,
      table: 'agSecrets',
      select: ['scope', 'scopeId', 'name'],
      columns: [
        {
          column: 'valueEncrypted',
          purpose: VARIABLES_SECRET_PURPOSE,
          aad: (row) =>
            variableAad({
              scope: String(row.scope),
              scopeId: String(row.scopeId),
              name: String(row.name),
            }),
        },
      ],
      connection,
    }),
    createSecretsTableStore({
      name: `${ACCESS_NAMESPACE}/model-services`,
      table: 'agModelServices',
      key: 'name',
      columns: [
        {
          column: 'apiKeyEncrypted',
          purpose: MODEL_SERVICE_KEY_SECRET_PURPOSE,
          aad: (row) => [String(row.name)],
        },
      ],
      connection,
    }),
  ];
}
