/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test, expect } from 'vitest';
import { generateRuntime } from '../lib/runtime-generator.js';

test('generateRuntime can map one resource to multiple command segments', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'nocobase-cli-config-'));
  const configFile = join(dir, 'config.json');

  await writeFile(
    configFile,
    JSON.stringify({
      modules: {
        migration: {
          name: 'migration',
          include: true,
          resources: {
            includes: ['migrationRules'],
            overrides: {
              migrationRules: {
                name: 'migration rules',
                segments: ['migration', 'rules'],
                topLevel: true,
              },
            },
          },
        },
      },
    }),
  );

  try {
    const runtime = await generateRuntime(
      {
        openapi: '3.0.2',
        info: {
          title: 'test',
          version: 'test',
        },
        paths: {
          '/migrationRules:list': {
            get: {
              responses: {
                200: {
                  description: 'OK',
                },
              },
            },
          },
        },
      } as any,
      configFile,
    );

    expect(runtime.commands.map((command) => command.commandId)).toEqual(['migration rules list']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('data modeling includes external data source modeling commands', async () => {
  const runtime = await generateRuntime(
    {
      openapi: '3.0.2',
      info: {
        title: 'test',
        version: 'test',
      },
      paths: {
        '/dataSources:listEnabled': {
          get: {
            tags: ['dataSources'],
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
        },
        '/dataSources/{associatedIndex}/collections:list': {
          get: {
            tags: ['dataSources.collections'],
            parameters: [
              {
                name: 'associatedIndex',
                in: 'path',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
        },
        '/dataSourcesCollections/{associatedIndex}/fields:list': {
          get: {
            tags: ['dataSourcesCollections.fields'],
            parameters: [
              {
                name: 'associatedIndex',
                in: 'path',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
        },
        '/dataSourcesCollections/{associatedIndex}/fields:apply': {
          post: {
            tags: ['dataSourcesCollections.fields'],
            parameters: [
              {
                name: 'associatedIndex',
                in: 'path',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              200: {
                description: 'OK',
              },
            },
          },
        },
      },
    } as any,
    resolve('packages/core/cli/nocobase-ctl.config.json'),
  );

  expect(runtime.commands.map((command) => command.commandId)).toEqual([
    'data-modeling data-sources collections list',
    'data-modeling data-sources list-enabled',
    'data-modeling data-sources-collections fields apply',
    'data-modeling data-sources-collections fields list',
  ]);
});
