import { describe } from 'vitest';
import ws from 'ws';

export { mockDatabase } from '@nocobase/database';
export { default as supertest } from 'supertest';
export * from './mockServer';

export const pgOnly: () => any = () => (process.env.DB_DIALECT == 'postgres' ? describe : describe.skip);
export const isPg = () => process.env.DB_DIALECT == 'postgres';

export function randomStr() {
  // create random string
  return Math.random().toString(36).substring(2);
}

export const waitSecond = async (timeout = 1000) => {
  await new Promise((resolve) => setTimeout(resolve, timeout));
};

export const startServerWithRandomPort = async (startServer) => {
  return await new Promise((resolve) => {
    startServer({
      port: 0,
      host: 'localhost',
      callback(server) {
        // @ts-ignore
        const port = server.address().port;
        resolve(port);
      },
    });
  });
};

export const createWsClient = async ({ serverPort, options = {} }) => {
  console.log(`connect to ws://localhost:${serverPort}${process.env.WS_PATH}`, options);

  const wsc = new ws(`ws://localhost:${serverPort}${process.env.WS_PATH}`, options);
  const messages = [];

  wsc.on('message', (data) => {
    const message = data.toString();
    messages.push(message);
  });

  // await connection established
  await new Promise((resolve) => {
    wsc.on('open', resolve);
  });

  return {
    wsc,
    messages,
    async stop() {
      const promise = new Promise((resolve) => {
        wsc.on('close', resolve);
      });

      wsc.close();
      await promise;
    },
    lastMessage() {
      return JSON.parse(messages[messages.length - 1]);
    },
  };
};
