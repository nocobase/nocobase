/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe } from 'vitest';
import ws from 'ws';

export { MockDatabase, mockDatabase } from '@nocobase/database';
export { default as supertest } from 'supertest';
export * from './memory-pub-sub-adapter';
export * from './mock-isolated-cluster';
export * from './mock-server';

export const pgOnly: () => any = () => (process.env.DB_DIALECT == 'postgres' ? describe : describe.skip);
export const isPg = () => process.env.DB_DIALECT == 'postgres';

export function randomStr() {
  // create random string
  return Math.random().toString(36).substring(2);
}

export function sleep(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const waitSecond = sleep;

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
