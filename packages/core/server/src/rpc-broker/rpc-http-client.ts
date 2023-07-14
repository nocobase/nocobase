import fetch from 'node-fetch';

interface RemoteCallOptions {
  remoteAddr: string;
  appName: string;
  method: string;
  args: any;
}

interface RemotePushOptions {
  remoteAddr: string;
  appName: string;
  event: string;
  options: any;
}

export class RpcHttpClient {
  remoteUrl(remoteAddr: string) {
    if (!remoteAddr.startsWith('http://')) {
      return `http://${remoteAddr}`;
    }

    return remoteAddr;
  }

  async call(options: RemoteCallOptions): Promise<{ result: any }> {
    const { remoteAddr, appName, method, args } = options;

    const url = `${this.remoteUrl(remoteAddr)}/call`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        args,
        appName,
      }),
    });

    const data = await response.json();

    return {
      result: data.result,
    };
  }

  async push(options: RemotePushOptions): Promise<boolean> {
    const { remoteAddr, appName, event, options: eventOptions } = options;

    const url = `${this.remoteUrl(remoteAddr)}/push`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        options: eventOptions,
        appName,
      }),
    });

    const data = await response.json();

    return data;
  }
}

const createRpcClient = () => {
  return new RpcHttpClient();
};

export { createRpcClient };
