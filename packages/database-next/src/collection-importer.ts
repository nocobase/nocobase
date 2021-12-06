import * as fs from 'fs';
import path from 'path';
import lodash from 'lodash';

export type ImportFileExtension = 'js' | 'ts' | 'json';

async function requireModule(module: any) {
  if (typeof module === 'string') {
    module = require(module);
  }

  if (typeof module !== 'object') {
    return module;
  }
  return module.__esModule ? module.default : module;
}

export class ImporterReader {
  directory: string;
  extensions: Set<string>;

  constructor(directory: string, extensions?: ImportFileExtension[]) {
    this.directory = directory;

    if (!extensions) {
      extensions = ['js', 'ts', 'json'];
    }

    this.extensions = new Set(extensions);
  }

  async read() {
    const modules = (
      await fs.promises.readdir(this.directory, {
        encoding: 'utf-8',
      })
    )
      .filter((fileName) =>
        this.extensions.has(path.parse(fileName).ext.replace('.', '')),
      )
      .map(
        async (fileName) =>
          await requireModule(path.join(this.directory, fileName)),
      );

    return (await Promise.all(modules)).filter((module) =>
      lodash.isPlainObject(module),
    );
  }
}
