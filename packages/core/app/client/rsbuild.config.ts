/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { generatePlugins, getRsbuildAlias } from '@nocobase/devtools/rsbuildConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const devtoolsPackageJson = require('../../devtools/package.json') as { version?: string };
const appVersion = devtoolsPackageJson.version || '';

generatePlugins();

function ensurePublicPath(value: string | undefined, fallback = '/') {
  let normalized = value || fallback;
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

function toDefineLiteral(value: string | undefined) {
  return value === undefined ? 'undefined' : JSON.stringify(value);
}

function createRuntimeHeadScript(appPublicPath: string, isBuild: boolean) {
  if (!isBuild) {
    return [
      `window['__nocobase_public_path__'] = ${JSON.stringify(appPublicPath)};`,
      `window['__nocobase_dev_public_path__'] = "/";`,
      `window['__esm_cdn_base_url__'] = ${JSON.stringify(process.env.ESM_CDN_BASE_URL || '')};`,
      `window['__esm_cdn_suffix__'] = ${JSON.stringify(process.env.ESM_CDN_SUFFIX || '')};`,
    ].join('\n');
  }

  return [
    `window['__webpack_public_path__'] = ${JSON.stringify(process.env.CDN_BASE_URL || '')};`,
    `window['__nocobase_public_path__'] = ${JSON.stringify(appPublicPath)};`,
    `window['__nocobase_api_base_url__'] = ${JSON.stringify(
      process.env.API_BASE_URL || process.env.API_BASE_PATH || '',
    )};`,
    `window['__nocobase_api_client_storage_prefix__'] = ${JSON.stringify(
      process.env.API_CLIENT_STORAGE_PREFIX || '',
    )};`,
    `window['__nocobase_api_client_storage_type__'] = ${JSON.stringify(process.env.API_CLIENT_STORAGE_TYPE || '')};`,
    `window['__nocobase_api_client_share_token__'] = ${process.env.API_CLIENT_SHARE_TOKEN === 'true'};`,
    `window['__nocobase_ws_url__'] = ${JSON.stringify(process.env.WEBSOCKET_URL || '')};`,
    `window['__nocobase_ws_path__'] = ${JSON.stringify(process.env.WS_PATH || '')};`,
    `window['__esm_cdn_base_url__'] = ${JSON.stringify(process.env.ESM_CDN_BASE_URL || '')};`,
    `window['__esm_cdn_suffix__'] = ${JSON.stringify(process.env.ESM_CDN_SUFFIX || '')};`,
  ].join('\n');
}

function createDefineValues(appPublicPath: string) {
  return {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.APP_PUBLIC_PATH': JSON.stringify(appPublicPath),
    'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || process.env.API_BASE_PATH || ''),
    'process.env.API_CLIENT_STORAGE_PREFIX': JSON.stringify(process.env.API_CLIENT_STORAGE_PREFIX || ''),
    'process.env.API_CLIENT_STORAGE_TYPE': JSON.stringify(process.env.API_CLIENT_STORAGE_TYPE || ''),
    'process.env.API_CLIENT_SHARE_TOKEN': JSON.stringify(process.env.API_CLIENT_SHARE_TOKEN || 'false'),
    'process.env.WEBSOCKET_URL': JSON.stringify(process.env.WEBSOCKET_URL || ''),
    'process.env.WS_PATH': JSON.stringify(process.env.WS_PATH || ''),
    'process.env.APP_ENV': toDefineLiteral(process.env.APP_ENV),
    'process.env.VERSION': JSON.stringify(appVersion),
    'process.env.__E2E__': toDefineLiteral(process.env.__E2E__),
    'process.env.USE_REMOTE_PLUGIN': toDefineLiteral(process.env.USE_REMOTE_PLUGIN),
  };
}

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  const isDev = !isBuild;
  const appPublicPath = ensurePublicPath(process.env.APP_PUBLIC_PATH, '/');
  const htmlPublicPath = isDev ? '/' : appPublicPath;
  const apiBasePath = ensurePublicPath(process.env.API_BASE_PATH, '/api/');
  const localStorageBasePath = ensurePublicPath(`${appPublicPath}storage/uploads/`, '/storage/uploads/');
  const staticBasePath = ensurePublicPath(`${appPublicPath}static/`, '/static/');
  const wsBasePath = ensurePublicPath(process.env.WS_PATH, '/ws/');
  const v2BasePath = ensurePublicPath(`${appPublicPath.replace(/\/$/, '')}/v2/`, '/v2/');
  const clientPort = toNumber(process.env.APP_PORT, 13001);
  const v2Port = toNumber(process.env.APP_V2_PORT, clientPort + 2);
  const hmrPath = `${appPublicPath.replace(/\/$/, '')}/__rspack_hmr`;
  const proxyTargetUrl = process.env.PROXY_TARGET_URL || `http://127.0.0.1:${clientPort + 1}`;
  const hmrClientHost = process.env.RSPACK_HMR_CLIENT_HOST || 'localhost';
  const hmrClientPort = toNumber(process.env.RSPACK_HMR_CLIENT_PORT, clientPort);
  const workspaceAliases = getRsbuildAlias();

  return {
    plugins: [pluginReact(), pluginLess(), pluginNodePolyfill(), pluginSvgr()],
    resolve: {
      alias: workspaceAliases,
    },
    source: {
      entry: {
        index: path.resolve(__dirname, 'src/main.tsx'),
      },
      tsconfigPath: path.resolve(__dirname, 'tsconfig.json'),
      define: createDefineValues(appPublicPath),
      decorators: {
        version: 'legacy',
      },
    },
    html: {
      template: path.resolve(__dirname, 'index.html'),
      scriptLoading: isBuild ? 'module' : 'defer',
      tags: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: `${htmlPublicPath}global.css`,
          },
          publicPath: false,
          head: true,
          append: false,
        },
        {
          tag: 'script',
          children: createRuntimeHeadScript(appPublicPath, isBuild),
          head: true,
          append: false,
        },
        {
          tag: 'script',
          attrs: {
            src: `${htmlPublicPath}browser-checker.js?v=1`,
          },
          publicPath: false,
          head: true,
          append: false,
        },
      ],
    },
    output: {
      target: 'web',
      distPath: {
        root: path.resolve(__dirname, '../dist/client'),
        js: 'assets',
        jsAsync: 'assets',
        css: 'assets',
        cssAsync: 'assets',
        svg: 'assets',
        font: 'assets',
        image: 'assets',
        media: 'assets',
      },
      filename: {
        js: '[name]-[contenthash:8].js',
        css: '[name]-[contenthash:8].css',
        svg: '[name]-[contenthash:8][ext][query]',
        font: '[name]-[contenthash:8][ext][query]',
        image: '[name]-[contenthash:8][ext][query]',
        media: '[name]-[contenthash:8][ext][query]',
      },
      assetPrefix: appPublicPath,
      cleanDistPath: true,
      sourceMap: {
        js: isBuild ? false : 'eval-cheap-module-source-map',
        css: false,
      },
    },
    server: {
      base: appPublicPath,
      host: '0.0.0.0',
      port: clientPort,
      compress: true,
      publicDir: {
        name: path.resolve(__dirname, 'public'),
      },
      proxy: {
        [apiBasePath]: {
          target: proxyTargetUrl,
          changeOrigin: true,
          ws: true,
          xfwd: true,
          pathRewrite: {
            [`^${apiBasePath}`]: apiBasePath,
          },
          onProxyRes(proxyRes, req, res) {
            if (req.headers.accept === 'text/event-stream') {
              res.writeHead(res.statusCode, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-transform',
                Connection: 'keep-alive',
              });
            }
          },
        },
        [localStorageBasePath]: {
          target: proxyTargetUrl,
          changeOrigin: true,
        },
        [staticBasePath]: {
          target: proxyTargetUrl,
          changeOrigin: true,
        },
        [wsBasePath]: {
          target: proxyTargetUrl,
          changeOrigin: true,
          ws: true,
          xfwd: true,
        },
        [v2BasePath]: {
          target: `http://127.0.0.1:${v2Port}`,
          changeOrigin: true,
          ws: true,
          pathRewrite: {
            [`^${v2BasePath}`]: v2BasePath,
          },
          xfwd: true,
        },
      },
      historyApiFallback: {
        disableDotRule: true,
        index: `${appPublicPath}index.html`,
      },
    },
    dev: {
      assetPrefix: appPublicPath,
      lazyCompilation: false,
      client: {
        overlay: false,
        protocol: 'ws',
        host: hmrClientHost,
        port: hmrClientPort,
        path: hmrPath,
      },
      progressBar: true,
    },
    tools: {
      rspack(config) {
        config.target = ['web', 'es2020'];
        config.performance = false;
        config.stats = 'errors-warnings';
      },
    },
  };
});
