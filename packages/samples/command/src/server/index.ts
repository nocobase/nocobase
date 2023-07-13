import * as fs from 'fs/promises';
import path from 'path';

import { InstallOptions, Plugin } from '@nocobase/server';

export class CommandPlugin extends Plugin {
  beforeLoad() {
    // TODO
  }

  async load() {
    this.app
      .command('export')
      .option('-o, --output-dir')
      .action(async (options, ...collections) => {
        const { outputDir = path.join(process.env.PWD, 'storage') } = options;
        await collections.reduce(
          (promise, collection) =>
            promise.then(async () => {
              if (!this.db.hasCollection(collection)) {
                console.warn('No such collection:', collection);
                return;
              }

              const repo = this.db.getRepository(collection);
              const data = repo.find();
              await fs.writeFile(path.join(outputDir, `${collection}.json`), JSON.stringify(data), { mode: 0o644 });
            }),
          Promise.resolve(),
        );
      });
  }

  async disable() {
    // this.app.resourcer.removeResource('testHello');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default CommandPlugin;
