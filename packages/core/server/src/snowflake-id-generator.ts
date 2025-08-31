/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Snowflake } from 'nodejs-snowflake';
import { WorkerIdManager } from './worker-id-manager';
import Application from './application';
import { AppSupervisor } from './app-supervisor';

export class SnowflakeIdGenerator {
  private static instance: SnowflakeIdGenerator;
  private mainApp: Application;
  private snowflake: Snowflake | null;
  // 2025-08-31 00:00:00
  private epoch = 1756569600000;

  constructor() {
    this.mainApp = AppSupervisor.getInstance().getMainApp();
    this.onAfterMainAppStop();
    this.init();
  }

  public static getInstance(): SnowflakeIdGenerator {
    if (!this.instance) {
      this.instance = new SnowflakeIdGenerator();
    }

    return this.instance;
  }

  private init() {
    if (this.snowflake) {
      return;
    }
    WorkerIdManager.getWorkerId()
      .then((workerId) => {
        this.snowflake = new Snowflake({
          custom_epoch: this.epoch,
          instance_id: workerId,
        });
      })
      .catch((err) => {
        this.mainApp?.log.error(err, {
          module: 'snowflake-id-generator',
          method: 'init',
        });
      });
  }

  getUniqueID() {
    if (!this.snowflake) {
      throw new Error('Can not generate snowflake id');
    }
    return this.snowflake.getUniqueID();
  }

  private onAfterMainAppStop() {
    if (this.mainApp) {
      this.mainApp.on('afterStop', async () => {
        this.snowflake = null;
      });
    }
  }
}

AppSupervisor.getInstance().on('afterAppAdded', (app: Application) => {
  app.db.setSnowflakeIdGenerator(SnowflakeIdGenerator.getInstance());
});
