import { defineCollection } from '@nocobase/database';
import { SETTINGS } from '../utils';

export default defineCollection({
  name: `${SETTINGS}`,
  dumpRules: 'required',
  migrationRules: ['overwrite', 'skip'],
  fields: [
    {
      type: 'boolean',
      name: 'scheduled',
    },
    {
      type: 'string',
      name: 'cron',
    },
    {
      type: 'integer',
      name: 'keep',
    },
    {
      type: 'boolean',
      name: 'enableFilesBackup',
    },
    {
      type: 'belongsTo',
      name: 'storage',
      target: 'storages',
      targetKey: 'id',
      foreignKey: 'storageId',
    },
    {
      type: 'string',
      name: 'encryptionPassword',
    },
  ],
});
