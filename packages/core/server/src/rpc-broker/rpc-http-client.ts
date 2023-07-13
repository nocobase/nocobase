import fetch from 'node-fetch';

interface RemoteCallOptions {
  remoteAddr: string;
  appName: string;
  method: string;
  args: any;
}

export class RpcHttpClient {
  async call(options: RemoteCallOptions): Promise<{ result: any }> {
    let { remoteAddr } = options;
    const { appName, method, args } = options;

    if (!remoteAddr.startsWith('http://')) {
      remoteAddr = `http://${remoteAddr}`;
    }

    const url = `${remoteAddr}/call`;
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
}

const createRpcClient = () => {
  return new RpcHttpClient();
};

export { createRpcClient };
