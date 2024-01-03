import { Application } from '@nocobase/server';
import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import crypto from 'crypto';
import EventEmitter from 'events';
import fsPromises from 'fs/promises';
import * as os from 'os';
import path from 'path';

export type AppMigratorOptions = {
  workDir?: string;
};
abstract class AppMigrator extends EventEmitter {
  public readonly workDir: string;
  public app: Application;

  abstract direction: 'restore' | 'dump';

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;

  constructor(app: Application, options?: AppMigratorOptions) {
    super();

    this.app = app;
    this.workDir = options?.workDir || this.tmpDir();
  }

  tmpDir() {
    return path.resolve(os.tmpdir(), `nocobase-${crypto.randomUUID()}`);
  }

  async rmDir(dir: string) {
    await fsPromises.rm(dir, { recursive: true, force: true });
  }

  async clearWorkDir() {
    await this.rmDir(this.workDir);
  }
}

applyMixins(AppMigrator, [AsyncEmitter]);
export { AppMigrator };
