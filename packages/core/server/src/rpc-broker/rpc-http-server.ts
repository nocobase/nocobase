import http from 'http';
import { AppSupervisor } from '../app-supervisor';
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

  const server = http.createServer((req, res) => {
    if (req.method == 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        const data = JSON.parse(body);

        console.log(`receive rpc request ${req.url} ${req.method}, ${body}`);

        let handlePromise;

        if (req.url == '/push') {
          const { appName, event, options } = data;

          handlePromise = localBroker.pushToApp(appName, event, options).then((result) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(result));
            res.end();
          });
        }

        if (req.url == '/call') {
          const { appName, method, args } = data;

          handlePromise = localBroker.callApp(appName, method, ...args).then((result) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(result));
            res.end();
          });
        }

        handlePromise?.catch((err) => {
          console.log(err);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify({ error: err.message }));
          res.end();
        });
      });
    } else {
      res.end();
    }
  });

  server.listen(rpcPort, rpcHost, () => {
    options.listenCallback && options.listenCallback(server);
    console.log(`rpc server is listening on ${rpcHost}:${rpcPort}`);
  });

  return server;
};
