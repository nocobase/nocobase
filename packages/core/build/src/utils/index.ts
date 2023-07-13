import { existsSync } from 'fs';
import { join } from 'path';

export function getExistFiles({ cwd, files, returnRelative, onlyOne = true }) {
  const res = [];
  for (const file of files) {
    const absFilePath = join(cwd, file);
    if (existsSync(absFilePath)) {
      const filePath = returnRelative ? file : absFilePath;
      res.push(filePath);
    }
  }

  return onlyOne ? res[0] : res; // undefined or string[]
}

export { getLernaPackages } from './getLernaPackages';
