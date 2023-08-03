export const getWebSocketURL = () => {
  if (!process.env.API_BASE_URL) {
    return;
  }
  if (process.env.WEBSOCKET_URL) {
    return process.env.WEBSOCKET_URL;
  }
  try {
    const url = new URL(process.env.API_BASE_URL);
    return `ws://${url.host}/ws`;
  } catch (error) {
    return `ws://${location.host}/ws`;
  }
};

export type WebSocketClientOptions = {
  reconnectInterval?: number;
  reconnectAttempts?: number;
  url?: string;
  protocols?: string | string[];
};

export class WebSocketClient {
  protected _ws: WebSocket;
  protected _reconnectTimes = 0;
  protected events = [];
  protected options: WebSocketClientOptions;
  protected enabled: boolean;

  constructor(options: WebSocketClientOptions | boolean) {
    if (!options) {
      this.enabled = false;
      return;
    }
    this.options = options === true ? {} : options;
    this.enabled = true;
  }

  get reconnectAttempts() {
    return this.options?.reconnectAttempts || 30;
  }

  get reconnectInterval() {
    return this.options?.reconnectInterval || 2000;
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
    const ws = new WebSocket(this.options.url || getWebSocketURL(), this.options.protocols);
    ws.onopen = () => {
      console.log('[nocobase-ws]: connected.');
      if (this._ws) {
        this.removeAllListeners();
      }
      this._reconnectTimes = 0;
      this._ws = ws;
      for (const { type, listener, options } of this.events) {
        this._ws.addEventListener(type, listener, options);
      }
    };
    ws.onerror = async () => {
      // setTimeout(() => this.connect(), this.reconnectInterval);
      console.log('onerror', this.readyState, this._reconnectTimes);
    };
    ws.onclose = async () => {
      setTimeout(() => this.connect(), this.reconnectInterval);
      console.log('onclose', this.readyState, this._reconnectTimes);
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

  removeAllListeners() {
    if (!this._ws) {
      return;
    }
    for (const { type, listener, options } of this.events) {
      this._ws.removeEventListener(type, listener, options);
    }
  }
}
