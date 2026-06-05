/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import MockAdapter from 'axios-mock-adapter';
import { Application, type ApplicationOptions } from './Application';
import { WebSocketClient, WebSocketClientOptions } from './WebSocketClient';

class MockApplication extends Application {
  apiMock: MockAdapter;
  constructor(options: ApplicationOptions = {}) {
    super({
      router: { type: 'memory', initialEntries: ['/'] },
      ...options,
    });
    this.apiMock = new MockAdapter(this.apiClient.axios);
    this.ws = new MockWebSocketClient(options.ws || {});
  }
}

class MockWebSocketClient extends WebSocketClient {
  public eventBus = new EventTarget();
  constructor(options: WebSocketClientOptions | boolean) {
    super(options);
  }
  connect() {}
  close() {}
  send() {}
  on(type: string, listener, options?: boolean | AddEventListenerOptions) {
    this.eventBus.addEventListener(
      type,
      (event: CustomEvent) => listener({ data: JSON.stringify(event.detail) }),
      options,
    );
  }
  emit(type: string, data: any) {
    this.eventBus.dispatchEvent(new CustomEvent(type, { detail: data }));
  }
  off(type: string, listener: EventListener, options?: boolean | EventListenerOptions) {
    this.eventBus.removeEventListener(type, listener, options);
  }
  removeAllListeners() {}
}

export function createMockClient(options?: ApplicationOptions) {
  const app = new MockApplication(options);
  return app;
}
