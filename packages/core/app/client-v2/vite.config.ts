/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const PROD_EXTERNALS = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'antd', '@ant-design/icons'];

function ensurePublicPath(value: string) {
  let normalized = value || '/v2/';
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getWorkspaceAliases() {
  const aliases: Record<string, string> = {};
  const rootDir = path.resolve(__dirname, '../../../../');
  const tsconfigPathsPath = path.resolve(rootDir, 'tsconfig.paths.json');
  if (!fs.existsSync(tsconfigPathsPath)) {
    return aliases;
  }

  const tsconfigPaths = JSON.parse(fs.readFileSync(tsconfigPathsPath, 'utf-8'));
  const paths = tsconfigPaths?.compilerOptions?.paths || {};
  for (const [name, values] of Object.entries(paths)) {
    if (!Array.isArray(values) || values.length === 0) {
      continue;
    }
    if (name.includes('*')) {
      continue;
    }
    aliases[name] = path.resolve(rootDir, values[0]);
  }

  return aliases;
}

export default defineConfig(({ command }) => {
  const appPublicPath = ensurePublicPath(process.env.APP_PUBLIC_PATH || '/');
  const v2PublicPath = ensurePublicPath(`${appPublicPath.replace(/\/$/, '')}/v2/`);
  const hmrPath = `${v2PublicPath.replace(/\/$/, '')}/__vite_hmr`;
  const v2Port = toNumber(process.env.APP_V2_PORT || process.env.PORT, 13002);
  const hmrClientPort = toNumber(process.env.VITE_HMR_CLIENT_PORT || process.env.APP_PORT, v2Port);
  const isBuild = command === 'build';
  const workspaceAliases = getWorkspaceAliases();

  return {
    root: __dirname,
    base: v2PublicPath,
    plugins: [
      nodePolyfills({
        include: ['process'],
        globals: {
          process: true,
          global: false,
          Buffer: false,
        },
      }),
      react(),
    ],
    resolve: {
      alias: {
        ...workspaceAliases,
        '@nocobase/client-v2': path.resolve(__dirname, '../../client-v2/src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: v2Port,
      strictPort: false,
      hmr: {
        clientPort: hmrClientPort,
        path: hmrPath,
      },
    },
    build: {
      target: 'es2020',
      outDir: path.resolve(__dirname, '../dist/client/v2'),
      emptyOutDir: true,
      rollupOptions: isBuild
        ? {
            external: PROD_EXTERNALS,
          }
        : undefined,
    },
  };
});
