/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { randomUUID } from 'crypto';

import { registerApiCallLogMiddleware } from './actions/apiCallLogging';
import { registerAgentSessionRoutes } from './actions/agentSessions';
import { registerConversationEventRoutes } from './actions/conversationEvents';
import { registerDispatchBindingRoutes, registerDispatchBindingValidationHooks } from './actions/dispatchBindings';
import { registerExternalRunImportRoutes } from './actions/externalRunImports';
import { cleanupExpiredFileUploads, registerFileUploadActions } from './actions/fileUploads';
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
import { AGENT_GATEWAY_API_RESOURCE, AGENT_GATEWAY_MACHINE_API_ACTIONS } from '../shared/apiContract';
import { registerAgentGatewayAcl } from './security/permissions';
import { cleanupAgentGatewayRetention } from './services/retention';
import { registerEventIngestCursorHooks } from './services/eventIngestCursor';
import { runWithMaintenanceLease } from './services/maintenanceLease';

const LEASE_RECOVERY_COLLECTIONS = ['agRuns', 'agRunEvents', 'agRunControlRequests', 'agMaintenanceLeases'];
const RETENTION_INTERVAL_MS = 6 * 60 * 60 * 1000;
const RETENTION_CONTINUATION_DELAY_MS = 1000;
const LEASE_RECOVERY_MAINTENANCE_TTL_MS = 2 * 60 * 1000;
const RETENTION_MAINTENANCE_TTL_MS = 60 * 60 * 1000;

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
  private readonly maintenanceOwnerId = randomUUID();
  private leaseRecoveryTimer?: ReturnType<typeof setInterval>;
  private leaseRecoveryQueue = Promise.resolve();
  private leaseRecoveryActive = false;
  private retentionTimer?: ReturnType<typeof setInterval>;
  private retentionContinuationTimer?: ReturnType<typeof setTimeout>;
  private retentionQueue = Promise.resolve();
  private retentionActive = false;
  private appLifecycleListenersRegistered = false;
  private readonly handleAppStarted = () => {
    this.startLeaseRecovery();
    this.startRetention();
  };
  private readonly handleAppStopping = async () => {
    await this.stopBackgroundMaintenance();
    await this.terminalStreamBroker?.unregister();
  };

  async afterAdd() {}

  async beforeLoad() {
    registerAgentGatewayAcl(this.app.acl);
    registerDispatchBindingValidationHooks(this);
    registerRunLifecycleHooks(this);
    registerEventIngestCursorHooks(this.db);
  }

  async load() {
    this.app.acl.allow(AGENT_GATEWAY_API_RESOURCE, [...AGENT_GATEWAY_MACHINE_API_ACTIONS], 'public');
    registerApiCallLogMiddleware(this);
    registerFileUploadActions(this);
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
    this.app.resourceManager.define({ name: AGENT_GATEWAY_API_RESOURCE });
    this.registerAppLifecycleListeners();
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {
    await this.stopBackgroundMaintenance();
    await this.terminalStreamBroker?.unregister();
    this.terminalStreamBroker = undefined;
  }

  async remove() {}

  private startLeaseRecovery() {
    this.stopLeaseRecovery();
    this.leaseRecoveryActive = true;
    this.leaseRecoveryTimer = setInterval(() => {
      this.scheduleLeaseRecovery('server-periodic');
    }, 30_000);
    unrefTimer(this.leaseRecoveryTimer);
    this.scheduleLeaseRecovery('server-startup');
  }

  private stopLeaseRecovery() {
    this.leaseRecoveryActive = false;
    if (!this.leaseRecoveryTimer) {
      return;
    }
    clearInterval(this.leaseRecoveryTimer);
    this.leaseRecoveryTimer = undefined;
  }

  private startRetention() {
    this.stopRetention();
    this.retentionActive = true;
    this.retentionTimer = setInterval(() => {
      this.scheduleRetention('server-periodic');
    }, RETENTION_INTERVAL_MS);
    unrefTimer(this.retentionTimer);
    this.scheduleRetention('server-startup');
  }

  private stopRetention() {
    this.retentionActive = false;
    if (this.retentionTimer) {
      clearInterval(this.retentionTimer);
      this.retentionTimer = undefined;
    }
    if (this.retentionContinuationTimer) {
      clearTimeout(this.retentionContinuationTimer);
      this.retentionContinuationTimer = undefined;
    }
  }

  private async stopBackgroundMaintenance() {
    this.stopLeaseRecovery();
    this.stopRetention();
    await Promise.all([this.leaseRecoveryQueue, this.retentionQueue]);
  }

  private scheduleRetentionContinuation() {
    if (!this.retentionActive || this.retentionContinuationTimer) {
      return;
    }
    this.retentionContinuationTimer = setTimeout(() => {
      this.retentionContinuationTimer = undefined;
      this.scheduleRetention('server-backlog-continuation');
    }, RETENTION_CONTINUATION_DELAY_MS);
    unrefTimer(this.retentionContinuationTimer);
  }

  private scheduleRetention(reason: string) {
    if (!this.retentionActive) {
      return this.retentionQueue;
    }
    this.retentionQueue = this.retentionQueue
      .then(async () => {
        if (!this.retentionActive) {
          return;
        }
        const maintenance = await runWithMaintenanceLease(this, {
          key: 'retention',
          ownerId: this.maintenanceOwnerId,
          ttlMs: RETENTION_MAINTENANCE_TTL_MS,
          task: async () => {
            const expiredUploadCount = await cleanupExpiredFileUploads(this);
            const result = await cleanupAgentGatewayRetention(this);
            return { expiredUploadCount, result };
          },
        });
        if (!maintenance.acquired || !maintenance.result) {
          return;
        }
        const { expiredUploadCount, result } = maintenance.result;
        if (
          expiredUploadCount > 0 ||
          result.deletedTotal > 0 ||
          result.recoveredImportBatches > 0 ||
          result.abandonedImportRuns > 0
        ) {
          this.app.logger?.info?.('Agent Gateway retention cleanup completed', {
            reason,
            expiredUploadCount,
            deletedTotal: result.deletedTotal,
            deletedByCollection: result.deletedByCollection,
            recoveredImportBatches: result.recoveredImportBatches,
            abandonedImportRuns: result.abandonedImportRuns,
            hasMore: result.hasMore,
            cleanedAt: result.cleanedAt,
          });
        }
        if (this.retentionActive && result.hasMore) {
          this.scheduleRetentionContinuation();
        }
      })
      .catch((error) => {
        this.app.logger?.warn?.('Agent Gateway retention cleanup failed', {
          reason,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    return this.retentionQueue;
  }

  private scheduleLeaseRecovery(reason: string) {
    if (!this.leaseRecoveryActive) {
      return this.leaseRecoveryQueue;
    }
    this.leaseRecoveryQueue = this.leaseRecoveryQueue
      .then(async () => {
        if (!this.leaseRecoveryActive) {
          return;
        }
        if (!(await this.isLeaseRecoveryStorageReady(reason))) {
          return;
        }
        const maintenance = await runWithMaintenanceLease(this, {
          key: 'lease-recovery',
          ownerId: this.maintenanceOwnerId,
          ttlMs: LEASE_RECOVERY_MAINTENANCE_TTL_MS,
          task: async () => await recoverExpiredRunLeases(this, reason),
        });
        if (!maintenance.acquired || !maintenance.result) {
          return;
        }
        const result = maintenance.result;
        if (result.stalledCount > 0 || result.failedCount > 0 || result.canceledCount > 0) {
          this.app.logger?.info?.('Agent Gateway recovered expired run leases', {
            reason,
            stalledCount: result.stalledCount,
            failedCount: result.failedCount,
            canceledCount: result.canceledCount,
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
