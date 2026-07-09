/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolve } from 'path';

import { Plugin } from '@nocobase/server';

import { registerApiCallLogMiddleware } from './actions/apiCallLogging';
import { registerAgentSessionRoutes } from './actions/agentSessions';
import { registerConversationEventRoutes } from './actions/conversationEvents';
import { registerDispatchBindingRoutes, registerDispatchBindingValidationHooks } from './actions/dispatchBindings';
import { registerExternalRunImportRoutes } from './actions/externalRunImports';
import { registerNodeLifecycleRoutes } from './actions/nodeLifecycle';
import { registerPromptTemplateRoutes } from './actions/promptTemplates';
import { recoverExpiredRunLeases, registerRunLifecycleHooks, registerRunLifecycleRoutes } from './actions/runLifecycle';
import { registerRunObservabilityRoutes } from './actions/runObservability';
import { registerTerminalStreamTicketRoutes } from './actions/terminalStreamTickets';
import { registerRunTerminalRoutes } from './actions/runTerminal';
import { registerSkillInstallRoutes } from './actions/skillInstalls';
import { registerSkillVersionRoutes } from './actions/skillVersions';
import { registerTaskTemplateRoutes } from './actions/taskTemplates';
import { TerminalStreamBroker, registerTerminalStreamBroker } from './actions/terminalStreamBroker';
import { registerAgentGatewayAcl } from './security/permissions';

const LEASE_RECOVERY_COLLECTIONS = ['agRuns', 'agRunEvents', 'agRunControlRequests'];

function unrefTimer(timer: ReturnType<typeof setInterval>) {
  if (!timer || typeof timer !== 'object' || !('unref' in timer)) {
    return;
  }
  const unref = timer.unref;
  if (typeof unref === 'function') {
    unref.call(timer);
  }
}

export class PluginAgentGatewayServer extends Plugin {
  private terminalStreamBroker?: TerminalStreamBroker;
  private leaseRecoveryTimer?: ReturnType<typeof setInterval>;
  private leaseRecoveryQueue = Promise.resolve();
  private appLifecycleListenersRegistered = false;
  private readonly handleAppStarted = async () => {
    await this.startLeaseRecovery();
  };
  private readonly handleAppStopping = () => {
    this.stopLeaseRecovery();
  };

  async afterAdd() {}

  async beforeLoad() {
    this.db.addMigrations({
      namespace: this.name,
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });

    registerAgentGatewayAcl(this.app.acl);
    registerDispatchBindingValidationHooks(this);
    registerRunLifecycleHooks(this);
  }

  async load() {
    registerApiCallLogMiddleware(this);
    registerNodeLifecycleRoutes(this);
    registerSkillInstallRoutes(this);
    registerSkillVersionRoutes(this);
    registerRunLifecycleRoutes(this);
    registerAgentSessionRoutes(this);
    registerConversationEventRoutes(this);
    registerRunTerminalRoutes(this);
    registerTerminalStreamTicketRoutes(this);
    registerRunObservabilityRoutes(this);
    registerExternalRunImportRoutes(this);
    registerTaskTemplateRoutes(this);
    registerPromptTemplateRoutes(this);
    registerDispatchBindingRoutes(this);
    this.terminalStreamBroker = registerTerminalStreamBroker(this);
    this.registerAppLifecycleListeners();
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {
    this.stopLeaseRecovery();
    this.terminalStreamBroker?.unregister();
    this.terminalStreamBroker = undefined;
  }

  async remove() {}

  private async startLeaseRecovery() {
    this.stopLeaseRecovery();
    this.leaseRecoveryTimer = setInterval(() => {
      this.scheduleLeaseRecovery('server-periodic');
    }, 30_000);
    unrefTimer(this.leaseRecoveryTimer);
    await this.scheduleLeaseRecovery('server-startup');
  }

  private stopLeaseRecovery() {
    if (!this.leaseRecoveryTimer) {
      return;
    }
    clearInterval(this.leaseRecoveryTimer);
    this.leaseRecoveryTimer = undefined;
  }

  private scheduleLeaseRecovery(reason: string) {
    this.leaseRecoveryQueue = this.leaseRecoveryQueue
      .then(async () => {
        if (!(await this.isLeaseRecoveryStorageReady(reason))) {
          return;
        }
        const result = await recoverExpiredRunLeases(this, reason);
        if (result.stalledCount > 0 || result.failedCount > 0) {
          this.app.logger?.info?.('Agent Gateway recovered expired run leases', {
            reason,
            stalledCount: result.stalledCount,
            failedCount: result.failedCount,
            scannedAt: result.scannedAt,
          });
        }
      })
      .catch((error) => {
        this.app.logger?.warn?.('Agent Gateway lease recovery failed', {
          reason,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return this.leaseRecoveryQueue;
  }

  private async isLeaseRecoveryStorageReady(reason: string) {
    for (const collectionName of LEASE_RECOVERY_COLLECTIONS) {
      if (!this.db.hasCollection(collectionName)) {
        this.app.logger?.debug?.('Agent Gateway lease recovery skipped because collection is not registered', {
          reason,
          collectionName,
        });
        return false;
      }
      const existsInDb = await this.db.collectionExistsInDb(collectionName);
      if (!existsInDb) {
        this.app.logger?.debug?.('Agent Gateway lease recovery skipped because table is not ready', {
          reason,
          collectionName,
        });
        return false;
      }
    }
    return true;
  }

  private registerAppLifecycleListeners() {
    if (this.appLifecycleListenersRegistered) {
      return;
    }
    this.appLifecycleListenersRegistered = true;
    this.app.on('afterStart', this.handleAppStarted);
    this.app.on('beforeStop', this.handleAppStopping);
    this.app.on('afterDestroy', this.handleAppStopping);
  }
}

export default PluginAgentGatewayServer;
