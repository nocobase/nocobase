import net from 'node:net';

/**
 * Keep the public dev listener alive while tsx replaces the application server.
 * Only retry connection establishment: no request bytes have reached a backend
 * yet, so this never replays an API mutation or an upgraded connection.
 */
export async function createDevConnectionProxy({
  host,
  port,
  targetPort,
  connectTimeoutMs = 30_000,
  retryMs = 50,
}) {
  const clients = new Set();
  const server = net.createServer((client) => {
    clients.add(client);
    client.pause();
    let upstream;
    let retry;
    const timeout = setTimeout(() => client.destroy(), connectTimeoutMs);
    const connect = () => {
      if (client.destroyed) return;
      const socket = net.connect({ host: '127.0.0.1', port: targetPort });
      upstream = socket;
      let connected = false;
      socket.once('connect', () => {
        if (client.destroyed) return socket.destroy();
        connected = true;
        clearTimeout(timeout);
        client.pipe(socket);
        socket.pipe(client);
      });
      socket.once('error', (error) => {
        socket.destroy();
        if (!connected && error.code === 'ECONNREFUSED' && !client.destroyed) {
          retry = setTimeout(connect, retryMs);
        } else {
          client.destroy();
        }
      });
    };
    client.on('error', () => client.destroy());
    client.once('close', () => {
      clearTimeout(timeout);
      clearTimeout(retry);
      upstream?.destroy();
      clients.delete(client);
    });
    connect();
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });
  return {
    port: server.address().port,
    close: () => {
      for (const client of clients) client.destroy();
      return new Promise((resolve) => server.close(resolve));
    },
  };
}
