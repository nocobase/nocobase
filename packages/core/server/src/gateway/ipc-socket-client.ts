import net from 'net';
import * as events from 'events';

export const writeJSON = (socket: net.Socket, data: object) => {
  socket.write(JSON.stringify(data) + '\n', 'utf8');
};

export class IPCSocketClient extends events.EventEmitter {
  client: net.Socket;

  constructor(client: net.Socket) {
    super();

    this.client = client;

    this.client.on('data', (data) => {
      const dataAsString = data.toString();
      const messages = dataAsString.split('\n');

      for (const message of messages) {
        if (message.length === 0) {
          continue;
        }

        const dataObj = JSON.parse(message);

        this.handleServerMessage(dataObj);
      }
    });
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

  async handleServerMessage({ type, payload }) {
    switch (type) {
      case 'error':
        console.error(payload.message);
        break;
      case 'success':
        console.log('success');
        break;
      default:
        console.log({ type, payload });
        break;
    }

    this.emit('response', { type, payload });
  }

  close() {
    this.client.end();
  }

  write(data: any) {
    writeJSON(this.client, data);

    return new Promise((resolve) => this.once('response', resolve));
  }
}
