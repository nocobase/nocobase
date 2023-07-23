const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { parse } = require('url');
const WebSocket = require('ws');
const { nanoid } = require('nanoid');
const EventEmitter = require('events');
const fetch = require('node-fetch');

function proxyRequest(req, res, targetUrl) {
  const url = new URL(req.url, targetUrl);
  fetch(url, {
    method: req.method,
    headers: req.headers,
    body: req.method === 'POST' ? req.body : undefined,
  })
    .then((response) => {
      res.writeHead(response.status, response.headers);
      response.body.pipe(res);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send(err.message);
    });
}

class CliHttpServer extends EventEmitter {
  static instance;
  server;

  workerReady = false;
  workerPort;

  cliDoingWork = null;

  ipcServer;
  socketPath = path.resolve(__dirname, '../../../../storage/cli-ipc.sock');

  port;

  lastWorkerError;
  exitWithError = false;

  devChildPid;

  wss;

  webSocketClients = new Map();

  ipcClient;

  constructor() {
    super();
    this.listenDomainSocket();
  }

  static getInstance() {
    if (!CliHttpServer.instance) {
      CliHttpServer.instance = new CliHttpServer();
    }

    return CliHttpServer.instance;
  }

  addNewConnection(ws, request) {
    const id = nanoid();

    ws.id = id;

    this.webSocketClients.set(id, {
      ws,
      tags: [`app#${process.env['STARTUP_SUBAPP'] || 'main'}`],
      url: request.url,
      headers: request.headers,
    });

    this.requestConnectionTag(id);

    console.log(`total connections: ${this.webSocketClients.size}`);

    this.sendMessageToConnection(this.webSocketClients.get(id), {
      type: 'appStatusChanged',
      payload: {
        workingMessage: this.cliDoingWork,
        tags: this.webSocketClients.get(id).tags,
      },
    });
  }

  removeConnection(id) {
    this.webSocketClients.delete(id);
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
      } else {
        proxyRequest(req, res, `http://localhost:${this.workerPort}`);
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

    this.loopThroughConnections((client) => {
      this.sendMessageToConnection(client, {
        type: 'appStatusChanged',
        payload: {
          workingMessage: cliDoingWork,
        },
      });
    });
  }

  listenDomainSocket() {
    if (fs.existsSync(this.socketPath)) {
      fs.unlinkSync(this.socketPath);
    }

    this.ipcServer = net.createServer((c) => {
      console.log('client connected');
      this.ipcClient = c;

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
        }
      });
    });

    this.ipcServer.listen(this.socketPath, () => {
      console.log('cli socket server bound');
    });
  }

  sendToConnectionsByTag(tagName, tagValue, sendMessage) {
    this.loopThroughConnections((client) => {
      if (client.tags.includes(`${tagName}#${tagValue}`)) {
        this.sendMessageToConnection(client, sendMessage);
      }
    });
  }

  sendMessageToConnection(client, sendMessage) {
    client.ws.send(JSON.stringify(sendMessage));
  }

  loopThroughConnections(callback) {
    this.webSocketClients.forEach((client) => {
      callback(client);
    });
  }

  handleClientMessage({ type, payload }) {
    console.log(`cli received message ${type}`);

    if (type === 'appStatusChanged') {
      const { appName, workingMessage } = payload;

      this.sendToConnectionsByTag('app', appName, {
        type: 'appStatusChanged',
        payload: {
          workingMessage,
        },
      });
    }

    if (type === 'needRefreshTags') {
      this.loopThroughConnections((client) => {
        this.requestConnectionTag(client.id);
      });
    }

    if (type === 'responseConnectionTags') {
      const { connectionId, tags } = payload;

      console.log({ connectionId, tags });
      const connection = this.webSocketClients.get(connectionId);

      connection.tags = tags;

      this.sendMessageToConnection(connection, {
        type: 'tagsChanged',
        payload: {
          tags,
        },
      });
    }

    if (type === 'gatewayCreated') {
      const workerPort = parseInt(this.port) + 1;
      this.workerPort = workerPort;

      this.writeJsonToIPCClient({
        type: 'startListen',
        payload: {
          port: workerPort,
        },
      });
    }

    if (type === 'listenStarted') {
      this.setCliDoingWork('worker started', { payload });
      this.workerReady = true;
    }

    if (type === 'workerExit' || type === 'workerRestart') {
      this.workerReady = false;
    }

    if (type === 'workerError') {
      this.cliDoingWork = `worker error: ${payload.error}`;
    }

    if (type === 'workerRestart') {
      this.setCliDoingWork('worker restarting');
      console.log(`killing dev child process ${this.devChildPid}`);
      process.kill(this.devChildPid, 'SIGTERM');
    }
  }

  requestConnectionTag(connectionId) {
    const connection = this.webSocketClients.get(connectionId);
    if (!connection) {
      return;
    }
    this.writeJsonToIPCClient({
      type: 'requestConnectionTags',
      payload: {
        id: connectionId,
        headers: connection.headers,
        url: connection.url,
      },
    });
  }

  writeJsonToIPCClient(data) {
    if (!this.ipcClient) {
      return;
    }
    this.ipcClient.write(JSON.stringify(data) + '\n', 'utf8');
  }
}

exports.CliHttpServer = CliHttpServer;
