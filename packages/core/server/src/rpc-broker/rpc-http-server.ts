import { AppSupervisor } from '@nocobase/server';
import http from 'http';

interface RpcHttpServerOptions {
  port: number;
  host?: string;
  appSupervisor: AppSupervisor;
}

export const createRpcHttpServer = (options: RpcHttpServerOptions) => {
  const { port: rpcPort, host: rpcHost, appSupervisor } = options;

  const server = http.createServer((req, res) => {});

  server.listen(rpcPort, rpcHost, () => {
    console.log(`rpc server is listening on ${rpcHost}:${rpcPort}`);
  });

  return server;
};
