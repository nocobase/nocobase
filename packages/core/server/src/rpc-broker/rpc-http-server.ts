import { AppSupervisor } from '@nocobase/server';
import http from 'http';
import { LocalBroker } from './local-broker';

interface RpcHttpServerOptions {
  port: number;
  host?: string;
  appSupervisor: AppSupervisor;
  listenCallback?: (server: http.Server) => void;
}

export const createRpcHttpServer = (options: RpcHttpServerOptions) => {
  const { port: rpcPort, host: rpcHost, appSupervisor } = options;

  const localBroker = new LocalBroker(appSupervisor);

  const server = http.createServer((req, res) => {});

  server.listen(rpcPort, rpcHost, () => {
    options.listenCallback && options.listenCallback(server);
    console.log(`rpc server is listening on ${rpcHost}:${rpcPort}`);
  });

  return server;
};
