/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command } from '@oclif/core';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  collectCommandModulePaths,
  commandRelativePathToRegistryKey,
  type CommandModuleExtension,
} from '../lib/command-discovery.ts';
import { getCurrentEnvName, getEnv } from '../lib/auth-store.ts';
import { createGeneratedFlags, GeneratedApiCommand } from '../lib/generated-command.ts';
import { loadRuntimeSync } from '../lib/runtime-store.ts';

const registryFilePath = fileURLToPath(import.meta.url);
const commandsRoot = join(dirname(registryFilePath), '../commands');
const commandModuleExtension: CommandModuleExtension = registryFilePath.endsWith('.ts') ? '.ts' : '.js';

async function loadCommandsFromDirectory() {
  const absolutePaths = await collectCommandModulePaths(commandsRoot, commandModuleExtension);
  const entries = await Promise.all(
    absolutePaths.map(async (absolutePath) => {
      const rel = relative(commandsRoot, absolutePath).replace(/\\/g, '/');
      const key = commandRelativePathToRegistryKey(rel);
      const mod = await import(pathToFileURL(absolutePath).href);
      return [key, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries);
}

function readEnvName(argv: string[]) {
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--env') {
      return argv[index + 1];
    }
    if (token === '-e') {
      return argv[index + 1];
    }
    if (token.startsWith('--env=')) {
      return token.slice('--env='.length);
    }
  }

  return undefined;
}

function createRuntimeCommand(operation: any) {
  return class RuntimeCommand extends GeneratedApiCommand {
    static summary = operation.summary;
    static description = operation.description;
    static examples = operation.examples as any;
    static flags = createGeneratedFlags(operation);
    static operation = operation;
  };
}

function createRuntimeIndexCommand(commandId: string, operation: any) {
  return class RuntimeIndexCommand extends Command {
    static summary = operation.resourceDescription || operation.resourceDisplayName || `Work with ${commandId}`;
    static description = operation.resourceDescription;

    async run(): Promise<void> {
      this.log(`Use \`nb ${commandId} --help\` to view available subcommands.`);
    }
  };
}

const registry: Record<string, any> = {
  ...(await loadCommandsFromDirectory()),
};

const envName = readEnvName(process.argv.slice(2)) ?? (await getCurrentEnvName());
const env = await getEnv(envName);
const runtime = loadRuntimeSync(env?.runtime?.version);

for (const operation of runtime?.commands ?? []) {
  const commandSegments = operation.commandId.split(' ');
  const commandKey = commandSegments.join(':');
  registry[`api:${commandKey}`] = createRuntimeCommand(operation);

  // const topLevelCommandId = commandSegments[0];
  // const modulePrefix = toKebabCase(operation.moduleDisplayName || operation.moduleName || '');
  // const isTopLevelResource = Boolean(topLevelCommandId && modulePrefix && topLevelCommandId !== modulePrefix);

  // if (isTopLevelResource && !registry[`api:${topLevelCommandId}`]) {
  //   registry[`api:${topLevelCommandId}`] = createRuntimeIndexCommand(`api ${topLevelCommandId}`, operation);
  // }
}

export default registry;
