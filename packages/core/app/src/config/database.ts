import { parseDatabaseOptionsFromEnv } from '@nocobase/database';

export async function parseDatabaseOptions() {
  return await parseDatabaseOptionsFromEnv();
}
