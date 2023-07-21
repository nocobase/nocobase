const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');
const WebSocket = require('ws');
const { nanoid } = require('nanoid');
const EventEmitter = require('events');

class CliHttpServer extends EventEmitter {
  static instance;
  server;

  workerReady = false;
  cliDoingWork = null;

  ipcServer;
  socketPath = path.resolve(__dirname, '../../../../storage/cli-ipc.sock');

  port;

  lastWorkerError;
  exitWithError = false;

  devChildPid;

  wss;

  webSocketClients = new Map();

  constructor() {
    super();
    this.listenDomainSocket();
  }

  addNewConnection(ws, request) {
    console.log(request);
    const id = nanoid();

    ws.id = id;

    this.webSocketClients.set(id, {
      ws,
      tags: [`app#${process.env['STARTUP_SUBAPP'] || 'main'}`],
    });
  }

  removeConnection(id) {
    this.webSocketClients.delete(id);
  }

  static getInstance() {
    if (!CliHttpServer.instance) {
      CliHttpServer.instance = new CliHttpServer();
    }

    return CliHttpServer.instance;
  }

  listen(port) {
    this.port = port;

    this.server = http.createServer((req, res) => {
      if (!this.workerReady) {
        res.writeHead(503);

        const data = {
          status: this.exitWithError ? 'exit-with-error' : 'not-ready',
          doing: this.cliDoingWork,
          lastWorkerError: this.lastWorkerError,
        };

        res.end(JSON.stringify(data));
      }
    });

    this.server.keepAliveTimeout = 1;

    this.wss = new WebSocket.Server({
      noServer: true,
    });

    this.wss.on('connection', (ws, request) => {
      this.addNewConnection(ws, request);
      console.log(`new client connected ${ws.id}`);

      ws.on('error', () => {
        this.removeConnection(ws.id);
      });
      ws.on('close', () => {
        this.removeConnection(ws.id);
      });
    });

    this.server.on('upgrade', (request, socket, head) => {
      const { pathname } = parse(request.url);

      if (pathname === '/ws') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.server.listen(port, () => {
      console.log(`cli http server listening on port ${port}`);
    });
  }

  setCliDoingWork(cliDoingWork) {
    this.cliDoingWork = cliDoingWork;
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
        const messages = dataAsString.split('\n');

        for (const message of messages) {
          if (message.length === 0) {
            continue;
          }

          const dataObj = JSON.parse(message);

          this.handleClientMessage(dataObj);

          // if (dataObj.workingMessage) {
          //   this.exitWithError = false;
          //   this.setCliDoingWork(dataObj.workingMessage);
          //   this.wss.clients.forEach((client) => {
          //     if (client.readyState === WebSocket.OPEN) {
          //       client.send(this.cliDoingWork);
          //     }
          //   });
          // }

          // if (dataObj.status === 'worker-ready') {
          //   // this.server.close();
          //   //
          //   // c.write('start');
          // }

          // if (dataObj.status === 'worker-exit' || dataObj.status === 'worker-restart') {
          //   if (!this.server.listening) {
          //     this.server.listen(this.port);
          //   }
          // }
          //
          // if (dataObj.status === 'worker-restart') {
          //   console.log(`killing dev child process ${this.devChildPid}`);
          //   process.kill(this.devChildPid, 'SIGTERM');
          // }
          //
          // if (dataObj.status === 'worker-error') {
          //   this.exitWithError = true;
          //   this.lastWorkerError = dataObj.errorMessage;
          // }
        }
      });
    });

    this.ipcServer.listen(this.socketPath, () => {
      console.log('cli socket server bound');
    });
  }

  sendToConnectionsByTag(tagName, tagValue, sendMessage) {
    this.webSocketClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        return;
      }

      if (client.tags.includes(`${tagName}#${tagValue}`)) {
        client.ws.send(JSON.stringify(sendMessage));
      }
    });
  }

  handleClientMessage({ type, payload }) {
    if (type === 'appStatusChanged') {
      const { appName, workingMessage } = payload;

      this.sendToConnectionsByTag('app', appName, {
        type: 'appStatusChanged',
        payload: {
          workingMessage,
        },
      });
    }
  }
}

exports.CliHttpServer = CliHttpServer;
