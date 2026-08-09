/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EventEmitter } from 'node:events';

export type PortalState = 'creating' | 'active' | 'draining' | 'destroying' | 'destroyed' | 'failed';

export type PortalEvent =
  | 'portal:beforeCreate'
  | 'portal:created'
  | 'portal:createFailed'
  | 'portal:requestStart'
  | 'portal:requestEnd'
  | 'portal:requestError'
  | 'portal:beforeDrain'
  | 'portal:draining'
  | 'portal:beforeDestroy'
  | 'portal:destroying'
  | 'portal:resourceDispose'
  | 'portal:resourceDisposed'
  | 'portal:destroyed'
  | 'portal:destroyFailed';

export interface PortalEventPayload {
  portalId: string;
  version: number;
  basePath: string;
  state: PortalState;
  reason?: string;
  requestId?: string;
  method?: string;
  path?: string;
  status?: number;
  durationMs?: number;
  resourceName?: string;
  error?: unknown;
  activeRequests?: number;
  metadata?: Record<string, unknown>;
}

export type PortalEventHandler = (payload: PortalEventPayload) => void | Promise<void>;

export class PortalEventBus {
  private readonly emitter = new EventEmitter();

  on(event: PortalEvent, handler: PortalEventHandler): () => void {
    this.emitter.on(event, handler);
    return () => this.emitter.off(event, handler);
  }

  once(event: PortalEvent, handler: PortalEventHandler): () => void {
    this.emitter.once(event, handler);
    return () => this.emitter.off(event, handler);
  }

  emit(event: PortalEvent, payload: PortalEventPayload): void {
    this.emitter.emit(event, payload);
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}
