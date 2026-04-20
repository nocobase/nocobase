/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Command, loadHelpClass } from '@oclif/core';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  collectCommandModulePaths,
  commandRelativePathToRegistryKey,
  type CommandModuleExtension,
} from '../lib/command-discovery.ts';
import { getCurrentEnvName, getEnv } from '../lib/auth-store.ts';
import { createGeneratedFlags, GeneratedApiCommand } from '../lib/generated-command.ts';
import { toKebabCase } from '../lib/naming.ts';
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

function createRuntimeIndexCommand(commandId: string, metadata: { summary?: string; description?: string }) {
  const summary = metadata.summary || `Work with ${commandId}`;
  const description = metadata.description && metadata.description !== summary ? metadata.description : undefined;

  return class RuntimeIndexCommand extends Command {
    static summary = summary;
    static description = description;

    async run(): Promise<void> {
      await this.parse(RuntimeIndexCommand);
      const Help = await loadHelpClass(this.config);
      await new Help(this.config, this.config.pjson.oclif.helpOptions ?? this.config.pjson.helpOptions).showHelp([
        this.id ?? commandId.replaceAll(' ', ':'),
        ...this.argv,
      ]);
    }
  };
}

function getRuntimeTopicEntries(operation: any) {
  const commandSegments = operation.commandId.split(' ');
  const topLevelCommandId = commandSegments[0];
  const modulePrefix = toKebabCase(operation.moduleDisplayName || operation.moduleName || '');
  const isTopLevelResource = Boolean(topLevelCommandId && modulePrefix && topLevelCommandId !== modulePrefix);
  const entries: Array<[string, { summary?: string; description?: string }]> = [];

  if (!topLevelCommandId) {
    return entries;
  }

  if (isTopLevelResource) {
    entries.push([
      topLevelCommandId,
      {
        summary: operation.resourceDescription || operation.resourceDisplayName,
        description: operation.resourceDescription,
      },
    ]);
    return entries;
  }

  entries.push([
    topLevelCommandId,
    {
      summary: operation.moduleDescription || operation.moduleDisplayName || operation.moduleName,
      description: operation.moduleDescription,
    },
  ]);

  const resourceCommandId = commandSegments.slice(0, 2).join(' ');
  if (commandSegments[1]) {
    entries.push([
      resourceCommandId,
      {
        summary: operation.resourceDescription || operation.resourceDisplayName,
        description: operation.resourceDescription,
      },
    ]);
  }

  return entries;
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

  for (const [topicCommandId, metadata] of getRuntimeTopicEntries(operation)) {
    const topicKey = `api:${topicCommandId.split(' ').join(':')}`;
    if (!registry[topicKey]) {
      registry[topicKey] = createRuntimeIndexCommand(`api ${topicCommandId}`, metadata);
    }
  }
}

export default registry;
