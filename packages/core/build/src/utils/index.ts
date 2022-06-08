import { existsSync } from 'fs';
import { join } from 'path';

export function getExistFile({ cwd, files, returnRelative }) {
  for (const file of files) {
    const absFilePath = join(cwd, file);
    if (existsSync(absFilePath)) {
      return returnRelative ? file : absFilePath;
    }
  }
}

export { getLernaPackages } from './getLernaPackages';
