// The runner's commands, by oclif id (`nocobase-runner start`). The runner knows no application's commands: an agent
// reaches its application through the CLI a run names (`RunPayload.cli`).
import type { Command } from '@oclif/core';

import { EnvList, EnvSet, EnvUnset } from './commands/env.ts';
import ConfigSet from './commands/config/set.ts';
import Gc from './commands/gc.ts';
import Logs from './commands/logs.ts';
import Register from './commands/register.ts';
import ServiceInstall from './commands/service/install.ts';
import ServiceUninstall from './commands/service/uninstall.ts';
import Start from './commands/start.ts';
import Status from './commands/status.ts';
import Stop from './commands/stop.ts';
import Uninstall from './commands/uninstall.ts';
import Unregister from './commands/unregister.ts';
import Update from './commands/update.ts';

export const COMMANDS: Record<string, Command.Class> = {
  register: Register,
  unregister: Unregister,
  start: Start,
  stop: Stop,
  status: Status,
  logs: Logs,
  'env:set': EnvSet,
  'env:unset': EnvUnset,
  'env:list': EnvList,
  gc: Gc,
  'config:set': ConfigSet,
  'service:install': ServiceInstall,
  'service:uninstall': ServiceUninstall,
  update: Update,
  uninstall: Uninstall,
};
