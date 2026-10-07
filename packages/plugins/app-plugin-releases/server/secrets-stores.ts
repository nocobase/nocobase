/**
 * Where the plugin keeps sealed values — environment credentials (`relEnvironments.secret`), registry passwords
 * (`relRegistries.secret`), environment and App variables, and what a deployment keeps of its variables and its first
 * administrator — for `nocobase secrets status` and `secrets rotate`.
 */
import {
  createSecretsTableStore,
  type SecretsStore,
} from '@nocobase/app-server/secrets';
import type { DatabaseConnection } from '@nocobase/db';

import { secretPurpose } from './services/secrets.js';
import { variableIdentity } from './services/variables.js';

export function createReleasesSecretsStores(
  connection: () => DatabaseConnection,
): SecretsStore[] {
  return [
    createSecretsTableStore({
      name: '@nocobase/app-plugin-releases/environments',
      table: 'relEnvironments',
      columns: [
        {
          column: 'secret',
          purpose: secretPurpose('environment-credentials'),
          aad: (row) => [String(row.id)],
        },
      ],
      connection,
    }),
    createSecretsTableStore({
      name: '@nocobase/app-plugin-releases/registries',
      table: 'relRegistries',
      columns: [
        {
          column: 'secret',
          purpose: secretPurpose('registry-credentials'),
          aad: (row) => [String(row.id)],
        },
      ],
      connection,
    }),
    createSecretsTableStore({
      name: '@nocobase/app-plugin-releases/environment-variables',
      table: 'relEnvironmentVariables',
      columns: [
        {
          column: 'value',
          purpose: secretPurpose('variables'),
          aad: (row) =>
            variableIdentity(
              'environment',
              String(row.environmentId),
              String(row.name),
            ),
        },
      ],
      select: ['environmentId', 'name'],
      connection,
    }),
    createSecretsTableStore({
      name: '@nocobase/app-plugin-releases/app-variables',
      table: 'relAppVariables',
      columns: [
        {
          column: 'value',
          purpose: secretPurpose('variables'),
          aad: (row) =>
            variableIdentity('app', String(row.appId), String(row.name)),
        },
      ],
      select: ['appId', 'name'],
      connection,
    }),
    createSecretsTableStore({
      name: '@nocobase/app-plugin-releases/deployments',
      table: 'relDeployments',
      columns: [
        {
          column: 'env',
          purpose: secretPurpose('deployment-env'),
          aad: (row) => [String(row.id)],
        },
        {
          column: 'initialAdmin',
          purpose: secretPurpose('initial-admin'),
          aad: (row) => [String(row.id)],
        },
      ],
      connection,
    }),
  ];
}
