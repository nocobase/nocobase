import { define, observable } from '@formily/reactive';
import { getSubAppName } from '@nocobase/sdk';
import { Application } from './Application';

export type WebSocketClientOptions = {
  reconnectInterval?: number;
  reconnectAttempts?: number;
  pingInterval?: number;
  url?: string;
  basename?: string;
  protocols?: string | string[];
  onServerDown?: any;
};

export class WebSocketClient {
  protected _ws: WebSocket;
  protected _reconnectTimes = 0;
  protected events = [];
  protected options: WebSocketClientOptions;
  app: Application;
  enabled: boolean;
  connected = false;
  serverDown = false;
  lastMessage = {};

  constructor(options: WebSocketClientOptions | boolean) {
    if (!options) {
      this.enabled = false;
      return;
    }
    this.options = options === true ? {} : options;
    this.enabled = true;
    define(this, {
      serverDown: observable.ref,
      connected: observable.ref,
      lastMessage: observable.ref,
    });
  }

  getURL() {
    if (!this.app) {
      return;
    }
    const options = this.app.getOptions();
    const apiBaseURL = options?.apiClient?.['baseURL'];
    if (!apiBaseURL) {
      return;
    }
    const subApp = getSubAppName(this.app.getPublicPath());
    const queryString = subApp ? `?__appName=${subApp}` : '';
    const wsPath = this.options.basename || '/ws';
    if (this.options.url) {
      const url = new URL(this.options.url);
      if (url.hostname === 'localhost') {
        const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
        return `${protocol}://${location.hostname}:${url.port}${wsPath}${queryString}`;
      }
      return `${this.options.url}${queryString}`;
    }
    try {
      const url = new URL(apiBaseURL);
      return `${url.protocol === 'https:' ? 'wss' : 'ws'}://${url.host}${wsPath}${queryString}`;
    } catch (error) {
      return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${wsPath}${queryString}`;
    }
  }

  get reconnectAttempts() {
    return this.options?.reconnectAttempts || 30;
  }

  get reconnectInterval() {
    return this.options?.reconnectInterval || 1000;
  }

  get pingInterval() {
    return this.options?.pingInterval || 30000;
  }

  get readyState() {
    if (!this._ws) {
      return -1;
    }
    return this._ws.readyState;
  }

  connect() {
    if (!this.enabled) {
      return;
    }
    if (this._reconnectTimes === 0) {
      console.log('[nocobase-ws]: connecting...');
    }
    if (this._reconnectTimes >= this.reconnectAttempts) {
      return;
    }
    if (this.readyState === WebSocket.OPEN) {
      return;
    }
    this._reconnectTimes++;
    const ws = new WebSocket(this.getURL(), this.options.protocols);
    let pingIntervalTimer: any;
    ws.onopen = () => {
      console.log('[nocobase-ws]: connected.');
      this.serverDown = false;
      if (this._ws) {
        this.removeAllListeners();
      }
      this._reconnectTimes = 0;
      this._ws = ws;
      for (const { type, listener, options } of this.events) {
        this._ws.addEventListener(type, listener, options);
      }
      pingIntervalTimer = setInterval(() => this.send('ping'), this.pingInterval);
      this.connected = true;
    };
    ws.onerror = async () => {
      // setTimeout(() => this.connect(), this.reconnectInterval);
      console.log('onerror', this.readyState, this._reconnectTimes);
    };
    ws.onclose = async (event) => {
      setTimeout(() => this.connect(), this.reconnectInterval);
      console.log('onclose', this.readyState, this._reconnectTimes, this.serverDown);
      this.connected = false;
      clearInterval(pingIntervalTimer);
      if (this._reconnectTimes >= Math.min(this.reconnectAttempts, 5)) {
        this.serverDown = true;
        this.emit('serverDown', event);
      }
    };
  }

  reconnect() {
    this._reconnectTimes = 0;
    this.connect();
  }

  close() {
    if (!this._ws) {
      return;
    }
    this._reconnectTimes = this.reconnectAttempts;
    return this._ws.close();
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (!this._ws) {
      return;
    }
    return this._ws.send(data);
  }

  on(type: string, listener: any, options?: boolean | AddEventListenerOptions) {
    this.events.push({ type, listener, options });
    if (!this._ws) {
      return;
    }
    this._ws.addEventListener(type, listener, options);
  }

  emit(type: string, args: any) {
    for (const event of this.events) {
      if (event.type === type) {
        event.listener(args);
      }
    }
  }

  off(type: string, listener: any, options?: boolean | EventListenerOptions) {
    let index = 0;
    for (const event of this.events) {
      if (event.type === type && event.listener === listener) {
        this.events.splice(index, 1);
        break;
      }
      index++;
    }
    if (!this._ws) {
      return;
    }
    this._ws.removeEventListener(type, listener, options);
  }

  removeAllListeners() {
    if (!this._ws) {
      return;
    }
    for (const { type, listener, options } of this.events) {
      this._ws.removeEventListener(type, listener, options);
    }
  }
}
