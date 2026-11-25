import { createRequire } from 'node:module';
import path from 'node:path';

import { describeMigration } from '@nocobase/app-testing/server';

const require = createRequire(import.meta.url);
const authPackage = '@nocobase/app-plugin-authentication';
const migration = '202611250001_verification_create_tables';

describeMigration(migration, {
  sources: [
    {
      packageName: authPackage,
      directory: path.join(
        path.dirname(require.resolve(`${authPackage}/package.json`)),
        'database/migrations',
      ),
    },
    {
      packageName: '@nocobase/app-plugin-verification',
      directory: path.resolve(import.meta.dirname, '../../database/migrations'),
    },
  ],
  up: async ({ expectCollection }) => {
    await expectCollection('userPhones').toHaveField('phone', {
      type: 'string',
      nullable: false,
      length: 16,
    });
    await expectCollection('verificationCodes').toHaveField('codeHash', {
      type: 'string',
      nullable: true,
      length: 64,
    });
    await expectCollection('verificationNumberLimits').toHaveField(
      'windowCount',
      { type: 'integer', nullable: false },
    );
    await expectCollection('verificationStepUpTokens').toHaveField(
      'tokenHash',
      { type: 'string', nullable: true, length: 64 },
    );
  },
  down: async ({ expectCollection }) => {
    for (const name of [
      'userPhones',
      'verificationCodes',
      'verificationNumberLimits',
      'verificationStepUpTokens',
    ]) {
      await expectCollection(name).not.toExist();
    }
  },
});
