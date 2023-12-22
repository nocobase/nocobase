import path from 'path';

import { Plugin, ApplicationOptions } from '@nocobase/server';
import { MockServer, mockServer } from '@nocobase/test';

import instructions from './instructions';
import functions from './functions';

interface MockServerOptions extends ApplicationOptions {
  autoStart?: boolean;
  collectionsPath?: string;
  cleanDb?: boolean;
}

async function createMockServer({ autoStart, collectionsPath, cleanDb, ...options }: MockServerOptions) {
  const app = mockServer(options);

  if (cleanDb) {
    await app.cleanDb();
  }

  await app.load();

  if (collectionsPath) {
    await app.db.import({ directory: collectionsPath });
  }

  try {
    await app.db.sync();
  } catch (error) {
    console.error(error);
  }

  if (autoStart) {
    await app.start();
    // await app.runCommand('start', '--quickstart');
  }

  return app;
}

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getApp({
  autoStart = true,
  cleanDb = true,
  plugins = [],
  ...options
}: MockServerOptions = {}): Promise<MockServer> {
  return createMockServer({
    ...options,
    autoStart,
    cleanDb,
    plugins: ['workflow', 'workflow-test', ...plugins],
  });
}

export default class extends Plugin {
  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    const workflow = this.app.getPlugin<any>('workflow');

    for (const [key, instruction] of Object.entries(instructions)) {
      workflow.instructions.register(key, instruction);
    }

    for (const [key, func] of Object.entries(functions)) {
      workflow.functions.register(key, func);
    }
  }
}
