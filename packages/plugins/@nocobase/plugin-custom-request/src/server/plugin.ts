import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { send } from './actions/send';
import { listByCurrentRole } from './actions/listByCurrentRole';
import { Logger, LoggerOptions, createLogger, getLoggerFilePath, getLoggerLevel } from '@nocobase/logger';
import winston from 'winston';

export class CustomRequestPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  getLogger(): Logger {
    const now = new Date();
    const filename = `${now.getFullYear()}-${`0${now.getMonth() + 1}`.slice(-2)}-${`0${now.getDate()}`.slice(-2)}.log`;

    const logger = createLogger({
      transports: [
        'console',
        new winston.transports.File({
          filename: getLoggerFilePath('custom-request', filename),
          level: getLoggerLevel(),
        }),
      ],
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
