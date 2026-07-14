/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';

import type { TerminalData, TerminalEnd, TerminalError, TerminalSnapshot } from '../../shared/terminalStreamProtocol';

export type TerminalStreamTransportDirection = 'browser-to-daemon' | 'daemon-to-browser';

export type TerminalStreamBrowserTransportEvent =
  | {
      type: 'browser.locate';
      eventId: string;
      requesterId: string;
      runId: string;
    }
  | {
      type: 'browser.snapshotRequest';
      eventId: string;
      requesterId: string;
      requestId: string;
      runId: string;
      fromOffset: number;
    }
  | {
      type: 'browser.controlAvailable';
      eventId: string;
      requesterId: string;
      runId: string;
      controlRequestId: string;
    };

export type TerminalStreamDaemonTransportEvent =
  | {
      type: 'daemon.state';
      eventId: string;
      ownerId: string;
      runId: string;
      sequence: number;
      state: 'bound' | 'heartbeat' | 'closed';
      nodeId?: string;
    }
  | {
      type: 'daemon.frame';
      eventId: string;
      ownerId: string;
      runId: string;
      sequence: number;
      frame: TerminalData | TerminalEnd;
    }
  | {
      type: 'daemon.snapshotResponse';
      eventId: string;
      ownerId: string;
      targetId: string;
      runId: string;
      requestId: string;
      frame: TerminalSnapshot | TerminalEnd | TerminalError;
    };

export type TerminalStreamTransportEvent = TerminalStreamBrowserTransportEvent | TerminalStreamDaemonTransportEvent;

export type TerminalStreamTransportListener = (event: TerminalStreamTransportEvent) => Promise<void>;
export type TerminalStreamTransportUnsubscribe = () => Promise<void>;

export interface TerminalStreamTransport {
  subscribe(
    runId: string,
    direction: TerminalStreamTransportDirection,
    listener: TerminalStreamTransportListener,
  ): Promise<TerminalStreamTransportUnsubscribe>;
  publish(
    runId: string,
    direction: TerminalStreamTransportDirection,
    event: TerminalStreamTransportEvent,
  ): Promise<void>;
  isShared(): Promise<boolean>;
  close(): Promise<void>;
}

function getChannel(appName: string, runId: string, direction: TerminalStreamTransportDirection) {
  return [
    'agent-gateway',
    'terminal',
    encodeURIComponent(appName || 'main'),
    encodeURIComponent(runId),
    direction,
  ].join('.');
}

export class NocoBaseTerminalStreamTransport implements TerminalStreamTransport {
  private readonly subscriptions = new Map<
    TerminalStreamTransportListener,
    { channel: string; callback: TerminalStreamTransportListener }
  >();

  constructor(private readonly app: Application) {}

  async subscribe(
    runId: string,
    direction: TerminalStreamTransportDirection,
    listener: TerminalStreamTransportListener,
  ) {
    const channel = getChannel(this.app.name || 'main', runId, direction);
    const callback: TerminalStreamTransportListener = async (event) => {
      await listener(event);
    };
    this.subscriptions.set(listener, { channel, callback });
    await this.app.pubSubManager.subscribe(channel, callback);
    return async () => {
      const subscription = this.subscriptions.get(listener);
      if (!subscription) {
        return;
      }
      this.subscriptions.delete(listener);
      await this.app.pubSubManager.unsubscribe(subscription.channel, subscription.callback);
    };
  }

  async publish(runId: string, direction: TerminalStreamTransportDirection, event: TerminalStreamTransportEvent) {
    const channel = getChannel(this.app.name || 'main', runId, direction);
    await this.app.pubSubManager.publish(channel, event, { skipSelf: true });
  }

  async isShared() {
    return await this.app.pubSubManager.isConnected();
  }

  async close() {
    const subscriptions = Array.from(this.subscriptions.values());
    this.subscriptions.clear();
    await Promise.all(
      subscriptions.map(async ({ channel, callback }) => {
        await this.app.pubSubManager.unsubscribe(channel, callback);
      }),
    );
  }
}

export class InMemoryTerminalStreamTransport implements TerminalStreamTransport {
  private readonly listeners = new Map<string, Set<TerminalStreamTransportListener>>();

  constructor(private readonly shared = true) {}

  async subscribe(
    runId: string,
    direction: TerminalStreamTransportDirection,
    listener: TerminalStreamTransportListener,
  ) {
    const channel = getChannel('memory', runId, direction);
    const listeners = this.listeners.get(channel) || new Set<TerminalStreamTransportListener>();
    listeners.add(listener);
    this.listeners.set(channel, listeners);
    return async () => {
      listeners.delete(listener);
      if (!listeners.size) {
        this.listeners.delete(channel);
      }
    };
  }

  async publish(runId: string, direction: TerminalStreamTransportDirection, event: TerminalStreamTransportEvent) {
    const channel = getChannel('memory', runId, direction);
    const listeners = Array.from(this.listeners.get(channel) || []);
    for (const listener of listeners) {
      await listener(event);
    }
  }

  async isShared() {
    return this.shared;
  }

  async close() {
    // Shared in-memory transports can be used by multiple broker instances.
    // Each broker removes only its own listeners through the unsubscribe handle.
  }
}
