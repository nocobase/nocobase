import net from 'net';

export const writeJSON = (socket: net.Socket, data: object) => {
  socket.write(JSON.stringify(data) + '\n', 'utf8');
};

export class IPCSocketClient {
  client: net.Socket;

  constructor(client: net.Socket) {
    this.client = client;

    this.client.on('data', (data) => {
      const dataAsString = data.toString();
      const messages = dataAsString.split('\n');

      for (const message of messages) {
        if (message.length === 0) {
          continue;
        }

        const dataObj = JSON.parse(message);

        IPCSocketClient.handleServerMessage(dataObj);
      }
    });
  }

  static async handleServerMessage({ type, payload }) {
    switch (type) {
      case 'error':
        console.error(payload.message);
        break;
      default:
        console.log({ type, payload });
        break;
    }
  }

  static async getConnection(serverPath: string) {
    return new Promise<IPCSocketClient>((resolve, reject) => {
      const client = net.createConnection({ path: serverPath }, () => {
        // 'connect' listener.
        resolve(new IPCSocketClient(client));
      });
      client.on('error', (err) => {
        reject(err);
      });
    });
  }

  close() {
    this.client.end();
  }

  write(data: any) {
    writeJSON(this.client, data);
  }
}
