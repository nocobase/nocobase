import { Command } from '@oclif/core';
import EnvAdd from '../commands/env/add.ts';
import EnvAuth from '../commands/env/auth.ts';
import Env from '../commands/env/index.ts';
import EnvList from '../commands/env/list.ts';
import EnvRemove from '../commands/env/remove.ts';
import EnvUpdate from '../commands/env/update.ts';
import EnvUse from '../commands/env/use.ts';
import ResourceCreate from '../commands/resource/create.ts';
import ResourceDestroy from '../commands/resource/destroy.ts';
import ResourceGet from '../commands/resource/get.ts';
import Resource from '../commands/resource/index.ts';
import ResourceList from '../commands/resource/list.ts';
import ResourceQuery from '../commands/resource/query.ts';
import ResourceUpdate from '../commands/resource/update.ts';
import { getCurrentEnvName, getEnv } from '../lib/auth-store.ts';
import { createGeneratedFlags, GeneratedApiCommand } from '../lib/generated-command.ts';
import { toKebabCase } from '../lib/naming.ts';
import { loadRuntimeSync } from '../lib/runtime-store.ts';

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
      this.log(`Use \`nocobase-ctl ${commandId} --help\` to view available subcommands.`);
    }
  };
}

const registry: Record<string, any> = {
  env: Env,
  'env:add': EnvAdd,
  'env:auth': EnvAuth,
  'env:list': EnvList,
  'env:remove': EnvRemove,
  'env:update': EnvUpdate,
  'env:use': EnvUse,
  resource: Resource,
  'resource:create': ResourceCreate,
  'resource:destroy': ResourceDestroy,
  'resource:get': ResourceGet,
  'resource:list': ResourceList,
  'resource:query': ResourceQuery,
  'resource:update': ResourceUpdate,
};

const envName = readEnvName(process.argv.slice(2)) ?? (await getCurrentEnvName());
const env = await getEnv(envName);
const runtime = loadRuntimeSync(env?.runtime?.version);

for (const operation of runtime?.commands ?? []) {
  const commandSegments = operation.commandId.split(' ');
  const commandKey = commandSegments.join(':');
  registry[commandKey] = createRuntimeCommand(operation);

  const topLevelCommandId = commandSegments[0];
  const modulePrefix = toKebabCase(operation.moduleDisplayName || operation.moduleName || '');
  const isTopLevelResource = Boolean(topLevelCommandId && modulePrefix && topLevelCommandId !== modulePrefix);

  if (isTopLevelResource && !registry[topLevelCommandId]) {
    registry[topLevelCommandId] = createRuntimeIndexCommand(topLevelCommandId, operation);
  }
}

export default registry;
