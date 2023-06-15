const http = require('http');

class CliHttpServer {
  static instance;
  server;

  workerReady = false;

  constructor() {}

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
}

exports.CliHttpServer = CliHttpServer;
