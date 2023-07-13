export class RpcHttpClient {
  async call(remoteAddr: string, method: string, ...args: any): Promise<{ result: any }> {
    const url = `http://${remoteAddr}/call`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method,
        args,
      }),
    });
    const data = await response.json();

    return {
      result: false,
    };
  }
}

const createRpcClient = () => {
  return new RpcHttpClient();
};

export { createRpcClient };
