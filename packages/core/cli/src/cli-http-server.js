const http = require('http');
const net = require('net');

class CliHttpServer {
  static instance;
  server;

  workerReady = false;
  ipcServer;
  socketPath = '/tmp/cli-http-server.sock';

  constructor() {
    this.listenDomainSocket();
  }

  static getInstance() {
    if (!CliHttpServer.instance) {
      CliHttpServer.instance = new CliHttpServer();
    }
    return CliHttpServer.instance;
  }

  listen(port) {
    this.server = http.createServer((req, res) => {
      if (!this.workerReady) {
        res.writeHead(503);
        res.end('worker not ready');
        return;
      }
      console.log('request');
    });

    this.server.listen(port, () => {
      console.log(`cli http server listening on port ${port}`);
    });
  }

  listenDomainSocket() {
    this.ipcServer = net.createServer();
    this.ipcServer.listen(this.socketPath);
  }
}

exports.CliHttpServer = CliHttpServer;
