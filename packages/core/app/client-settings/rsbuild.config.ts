/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginNodePolyfill } from '@rsbuild/plugin-node-polyfill';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { getRsbuildBrowserAlias } from '@nocobase/devtools/rsbuildConfig';
import { createPortalDevProxyOptions } from '../portalDevProxy';
import { generateSettingsPluginImports } from './generatePluginImports';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_DIST_DIR = 'settings';

process.env.APP_PACKAGE_ROOT ||= path.resolve(__dirname, '..');
generateSettingsPluginImports(path.resolve(__dirname, 'src/.plugins'));

function ensurePublicPath(value: string | undefined, fallback = '/') {
  let normalized = value || fallback;
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized.replace(/\/{2,}/g, '/');
}

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeModernClientPrefix(value: string | undefined) {
  const normalized = String(value || 'v')
    .trim()
    .replace(/^\/+|\/+$/g, '');
  return normalized || 'v';
}

function assertAvailableModernClientPrefix(value: string | undefined) {
  if (normalizeModernClientPrefix(value) === SETTINGS_DIST_DIR) {
    throw new Error('APP_MODERN_CLIENT_PREFIX "settings" is reserved for the standalone Settings application.');
  }
}

function createRuntimeHeadScript(appPublicPath: string, isBuild: boolean) {
  return [
    `window['__nocobase_public_path__'] = window['__nocobase_public_path__'] ?? ${JSON.stringify(appPublicPath)};`,
    `window['__nocobase_modern_client_prefix__'] = window['__nocobase_modern_client_prefix__'] ?? ${JSON.stringify(
      normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX),
    )};`,
    `window['__webpack_public_path__'] = window['__webpack_public_path__'] ?? ${JSON.stringify(
      isBuild ? process.env.CDN_BASE_URL || '' : '',
    )};`,
    `window['__nocobase_api_base_url__'] = window['__nocobase_api_base_url__'] ?? ${JSON.stringify(
      process.env.API_BASE_URL || process.env.API_BASE_PATH || '',
    )};`,
    `window['__nocobase_api_client_storage_prefix__'] = window['__nocobase_api_client_storage_prefix__'] ?? ${JSON.stringify(
      process.env.API_CLIENT_STORAGE_PREFIX || '',
    )};`,
    `window['__nocobase_api_client_storage_type__'] = window['__nocobase_api_client_storage_type__'] ?? ${JSON.stringify(
      process.env.API_CLIENT_STORAGE_TYPE || '',
    )};`,
    `window['__nocobase_api_client_share_token__'] = window['__nocobase_api_client_share_token__'] ?? ${JSON.stringify(
      process.env.API_CLIENT_SHARE_TOKEN || 'false',
    )};`,
    `window['__nocobase_ws_url__'] = window['__nocobase_ws_url__'] ?? ${JSON.stringify(
      process.env.WEBSOCKET_URL || '',
    )};`,
    `window['__nocobase_ws_path__'] = window['__nocobase_ws_path__'] ?? ${JSON.stringify(process.env.WS_PATH || '')};`,
    `window['__nocobase_app_dev__'] = window['__nocobase_app_dev__'] ?? ${JSON.stringify(
      process.env.NOCOBASE_APP_DEV === 'true',
    )};`,
    `window['__esm_cdn_base_url__'] = window['__esm_cdn_base_url__'] ?? ${JSON.stringify(
      process.env.ESM_CDN_BASE_URL || 'https://esm.sh',
    )};`,
    `window['__esm_cdn_suffix__'] = window['__esm_cdn_suffix__'] ?? ${JSON.stringify(
      process.env.ESM_CDN_SUFFIX || '',
    )};`,
  ].join('\n');
}

function createDefineValues(appPublicPath: string) {
  return {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || process.env.API_BASE_PATH || ''),
    'import.meta.env.APP_PUBLIC_PATH': JSON.stringify(appPublicPath),
    'import.meta.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || process.env.API_BASE_PATH || ''),
    'import.meta.env.API_CLIENT_STORAGE_PREFIX': JSON.stringify(process.env.API_CLIENT_STORAGE_PREFIX || ''),
    'import.meta.env.API_CLIENT_STORAGE_TYPE': JSON.stringify(process.env.API_CLIENT_STORAGE_TYPE || ''),
    'import.meta.env.API_CLIENT_SHARE_TOKEN': JSON.stringify(process.env.API_CLIENT_SHARE_TOKEN || 'false'),
    'import.meta.env.WS_URL': JSON.stringify(process.env.WEBSOCKET_URL || ''),
    'import.meta.env.WS_PATH': JSON.stringify(process.env.WS_PATH || ''),
  };
}

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  assertAvailableModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX);

  const appPublicPath = ensurePublicPath(process.env.APP_PUBLIC_PATH, '/');
  const settingsPublicPath = isBuild
    ? `/${SETTINGS_DIST_DIR}/`
    : ensurePublicPath(`${appPublicPath}${SETTINGS_DIST_DIR}/`);
  const apiBasePath = ensurePublicPath(process.env.API_BASE_PATH, '/api/');
  const fileBasePath = ensurePublicPath(`${appPublicPath}files/`);
  const localStorageBasePath = ensurePublicPath(`${appPublicPath}storage/uploads/`);
  const staticBasePath = ensurePublicPath(`${appPublicPath}static/`);
  const wsBasePath = ensurePublicPath(process.env.WS_PATH, '/ws/');
  const appPort = toNumber(process.env.APP_PORT, 13001);
  const settingsPort = toNumber(process.env.APP_SETTINGS_PORT, appPort + 3);
  const hmrClientHost = process.env.RSPACK_HMR_CLIENT_HOST;
  const hmrClientPort = toNumber(process.env.RSPACK_HMR_CLIENT_PORT || process.env.APP_PORT, settingsPort);
  const proxyTargetUrl = process.env.PROXY_TARGET_URL || `http://127.0.0.1:${appPort}`;
  const workspaceAliases = getRsbuildBrowserAlias();

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
    },
    html: {
      template: path.resolve(__dirname, 'index.html'),
      scriptLoading: isBuild ? 'module' : 'defer',
      tags: [
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: `${settingsPublicPath}global.css`,
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
            src: `${settingsPublicPath}browser-checker.js?v=1`,
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
        root: path.resolve(__dirname, '../dist/client/settings'),
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
      assetPrefix: settingsPublicPath,
      cleanDistPath: true,
      sourceMap: {
        js: isBuild ? false : 'eval-cheap-module-source-map',
        css: false,
      },
    },
    server: {
      base: settingsPublicPath,
      host: '0.0.0.0',
      port: settingsPort,
      compress: true,
      publicDir: {
        name: path.resolve(__dirname, '../client-v2/public'),
      },
      proxy: [
        createPortalDevProxyOptions(appPublicPath, proxyTargetUrl),
        {
          context: apiBasePath,
          target: proxyTargetUrl,
          changeOrigin: true,
          ws: true,
          xfwd: true,
        },
        {
          context: localStorageBasePath,
          target: proxyTargetUrl,
          changeOrigin: true,
        },
        {
          context: fileBasePath,
          target: proxyTargetUrl,
          changeOrigin: true,
        },
        {
          context: staticBasePath,
          target: proxyTargetUrl,
          changeOrigin: true,
        },
        {
          context: wsBasePath,
          target: proxyTargetUrl,
          changeOrigin: true,
          ws: true,
          xfwd: true,
        },
      ],
      historyApiFallback: {
        disableDotRule: true,
        index: `${settingsPublicPath}index.html`,
      },
    },
    dev: {
      assetPrefix: settingsPublicPath,
      lazyCompilation: false,
      client: {
        overlay: false,
        protocol: 'ws',
        host: hmrClientHost,
        port: hmrClientPort,
        path: `${settingsPublicPath.replace(/\/$/, '')}/__rspack_hmr`,
      },
      progressBar: true,
    },
    tools: {
      rspack(config) {
        config.target = ['web', 'es2020'];
        config.output.module = isBuild;
        config.output.chunkFormat = isBuild ? 'module' : 'array-push';
        config.experiments = {
          ...config.experiments,
          outputModule: isBuild,
        };
        config.optimization = {
          ...config.optimization,
          runtimeChunk: 'single',
          splitChunks: {
            chunks: 'all',
          },
        };
        config.performance = false;
        config.stats = 'errors-warnings';
      },
    },
  };
});
