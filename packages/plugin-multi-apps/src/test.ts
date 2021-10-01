import { readFileSync } from 'fs';
import glob from 'glob';
import path from 'path';

function sql() {
  const arr = [];
  const files = glob.sync(path.resolve(__dirname, './db/*.sql'));
  for (const file of files) {
    const sql = readFileSync(file).toString();
    arr.push(sql);
  }
  return arr;
}
