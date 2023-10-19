import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { send } from './actions/send';
import { listByCurrentRole } from './actions/listByCurrentRole';
import { Logger, LoggerOptions, Transports, createLogger, getLoggerFilePath, getLoggerLevel } from '@nocobase/logger';
import winston from 'winston';
import { DailyRotateFile } from 'winston/lib/winston/transports';

export class CustomRequestPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  logger = this.getLogger();

  getLogger(): Logger {
    const now = new Date();
    const logger = createLogger({
      transports: ['console', Transports.dailyRotateFile()],
    } as LoggerOptions);

    return logger;
  }

  async load() {
    await this.db.import({
      directory: resolve(__dirname, './collections'),
    });

    this.app.resource({
      name: 'customRequests',
      actions: {
        send: send.bind(this),
        listByCurrentRole,
      },
    });

    this.app.acl.registerSnippet({
      name: `ui.${this.name}`,
      actions: ['customRequests:*'],
    });

    this.app.acl.allow('customRequests', ['send', 'listByCurrentRole'], 'loggedIn');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CustomRequestPlugin;
