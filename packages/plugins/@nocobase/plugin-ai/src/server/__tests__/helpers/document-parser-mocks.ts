/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Readable } from 'node:stream';

export function createTextStream(text: string) {
  return Readable.from([Buffer.from(text, 'utf-8')]);
}

export function createMockPlugin(options?: {
  createFileRecord?: (args: any) => Promise<any>;
  getFileStream?: (file: any) => Promise<{ stream: Readable; contentType?: string }>;
  getFileURL?: (file: any) => Promise<string>;
  findById?: (id: number | string) => Promise<any>;
  update?: (args: any) => Promise<any>;
  parserLoad?: (file: any) => Promise<any>;
}) {
  const repo = {
    findById: options?.findById ?? (async () => null),
    update: options?.update ?? (async () => ({})),
  };

  const fileManager = {
    storagesCache: new Map([[1, { id: 1, name: 'local' }]]),
    loadStorages: async () => {},
    createFileRecord:
      options?.createFileRecord ??
      (async () => ({
        id: 2,
        filename: 'parsed.txt',
        extname: '.txt',
        mimetype: 'text/plain',
      })),
    getFileStream:
      options?.getFileStream ?? (async () => ({ stream: createTextStream('cached text'), contentType: 'text/plain' })),
    getFileURL: options?.getFileURL ?? (async () => '/tmp/mock-file.txt'),
  };

  const app: any = {
    environment: {
      renderJsonTemplate: (value: any) => value,
    },
    pm: {
      get: (name: string) => {
        if (name === 'file-manager') {
          return fileManager;
        }
        if (name === 'ai') {
          return {
            documentParserManager: {
              load: options?.parserLoad ?? (async () => ({ supported: true, text: 'parsed text', documents: [] })),
            },
          };
        }
      },
    },
  };

  const plugin: any = {
    app,
    db: {
      getRepository: () => repo,
    },
  };

  return {
    app,
    plugin,
    repo,
    fileManager,
  };
}
