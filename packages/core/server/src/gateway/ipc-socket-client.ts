import net from 'net';

const writeJSON = (socket: net.Socket, data: object) => {
  socket.write(JSON.stringify(data) + '\n', 'utf8');
};

export class IPCSocketClient {
  client: net.Socket;

  constructor(client: net.Socket) {
    this.client = client;
  }

  static async getConnection(serverPath: string) {
    return new Promise<IPCSocketClient>((resolve, reject) => {
      const client = net.createConnection({ path: serverPath }, () => {
        // 'connect' listener.
        console.log('connected to server!');
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
