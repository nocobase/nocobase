import lodash from 'lodash';
import { Database } from '@nocobase/database';
import fs from 'fs';
import readline from 'readline';

export const DUMPED_EXTENSION = 'nbdump';

export function sqlAdapter(database: Database, sql: string) {
  if (database.sequelize.getDialect() === 'mysql') {
    return lodash.replace(sql, /"/g, '`');
  }

  return sql;
}

export async function readLines(filePath: string) {
  const results = [];
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    results.push(line);
  }
  return results;
}
