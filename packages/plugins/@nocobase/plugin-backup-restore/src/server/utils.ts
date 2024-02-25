import lodash from 'lodash';
import { Database } from '@nocobase/database';
import fs from 'fs';
import readline from 'readline';

export const DUMPED_EXTENSION = 'nbdump';

export function sqlAdapter(database: Database, sql: string) {
  if (database.isMySQLCompatibleDialect()) {
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

export function humanFileSize(bytes, si = false, dp = 1) {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);

  return bytes.toFixed(dp) + ' ' + units[u];
}
