const http = require('http');
const net = require('net');
const fs = require('fs');

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
    if (fs.existsSync(this.socketPath)) {
      fs.unlinkSync(this.socketPath);
    }

    this.ipcServer = net.createServer((c) => {
      console.log('client connected');

      c.on('end', () => {
        console.log('client disconnected');
      });

      c.on('data', (data) => {
        const dataAsString = data.toString();
        const dataObj = JSON.parse(dataAsString);
        if (dataObj.status == 'worker-ready') {
          this.server.close();

          c.write('start');
        }
      });
    });

    this.ipcServer.listen(this.socketPath, () => {
      console.log('cli socket server bound');
    });
  }
}

exports.CliHttpServer = CliHttpServer;
