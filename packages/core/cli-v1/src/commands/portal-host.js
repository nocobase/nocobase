/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
const { Command } = require('commander');
const net = require('net');
const { homedir } = require('os');
const { isAbsolute, resolve } = require('path');
const xpipe = require('xpipe');
const { storagePathJoin } = require('../util');

function getSocketPath() {
  const socketPath = process.env.SOCKET_PATH;
  if (socketPath) {
    return isAbsolute(socketPath) ? socketPath : resolve(process.cwd(), socketPath);
  }
  if (process.env.NOCOBASE_RUNNING_IN_DOCKER === 'true') {
    return resolve(homedir(), '.nocobase', 'gateway.sock');
  }
  return storagePathJoin('gateway.sock');
}

function writeJSON(socket, data) {
  socket.write(`${JSON.stringify(data)}\n`, 'utf8');
}

function requestGateway(type) {
  const socketPath = getSocketPath();

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ path: xpipe.eq(socketPath) }, () => {
      writeJSON(socket, { type });
    });

    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      const newlineIndex = buffer.indexOf('\n');
      if (newlineIndex === -1) {
        return;
      }

      const line = buffer.slice(0, newlineIndex);
      const response = JSON.parse(line);
      socket.end();
      if (response.type === 'error') {
        reject(new Error(response.payload?.message || 'Gateway IPC request failed'));
        return;
      }

      resolve(response.payload);
    });
    socket.on('error', (error) => {
      reject(
        new Error(
          `NocoBase Gateway is not running or cannot be reached through IPC socket ${socketPath}: ${error.message}`,
        ),
      );
    });
  });
}

function printPortalHostInfo(info) {
  if (!info) {
    console.log('No portal-host status returned.');
    return;
  }

  console.log(`driver: ${info.driver}`);
  console.log(`status: ${info.status}`);
  if (info.targetUrl) {
    console.log(`url: ${info.targetUrl}`);
  }
  if (info.pid) {
    console.log(`pid: ${info.pid}`);
  }
  console.log(`active leases: ${info.activeLeases ?? 0}`);
  if (info.portalsDir) {
    console.log(`portals dir: ${info.portalsDir}`);
  }
  if (info.entrypoint) {
    console.log(`entrypoint: ${info.entrypoint}`);
  }
}

async function runPortalHostAction(action) {
  const response = await requestGateway(`portalHost:${action}`);
  if (response?.message) {
    console.log(response.message);
  }

  const info = response?.info || response;
  printPortalHostInfo(info);
}

async function handlePortalHostAction(action) {
  try {
    await runPortalHostAction(action);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const command = cli.command('portal-host').description('Manage the NocoBase portal-host runtime');

  command
    .command('status')
    .description('Show portal-host runtime status')
    .action(async () => {
      await handlePortalHostAction('status');
    });

  command
    .command('start')
    .description('Start the managed portal-host runtime')
    .action(async () => {
      await handlePortalHostAction('start');
    });

  command
    .command('restart')
    .description('Restart the managed portal-host runtime')
    .action(async () => {
      await handlePortalHostAction('restart');
    });

  command
    .command('stop')
    .description('Stop the managed portal-host runtime')
    .action(async () => {
      await handlePortalHostAction('stop');
    });
};

module.exports._test = {
  getSocketPath,
  requestGateway,
};
