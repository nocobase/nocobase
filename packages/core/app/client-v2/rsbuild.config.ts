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
import { generateV2Plugins, getRsbuildAlias } from '@nocobase/devtools/rsbuildConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

generateV2Plugins();

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

function createRuntimeHeadScript(v2PublicPath: string, isBuild: boolean) {
  if (!isBuild) {
    return [
      `window['__nocobase_public_path__'] = window['__nocobase_public_path__'] || ${JSON.stringify(v2PublicPath)};`,
      `window['__esm_cdn_base_url__'] = window['__esm_cdn_base_url__'] || ${JSON.stringify(
        process.env.ESM_CDN_BASE_URL || 'https://esm.sh',
      )};`,
      `window['__esm_cdn_suffix__'] = window['__esm_cdn_suffix__'] || ${JSON.stringify(
        process.env.ESM_CDN_SUFFIX || '',
      )};`,
    ].join('\n');
  }

  return [
    `window['__nocobase_public_path__'] = window['__nocobase_public_path__'] || ${JSON.stringify(v2PublicPath)};`,
    `window['__nocobase_api_base_url__'] = window['__nocobase_api_base_url__'] || ${JSON.stringify(
      process.env.API_BASE_URL || process.env.API_BASE_PATH || '',
    )};`,
    `window['__nocobase_api_client_storage_prefix__'] = window['__nocobase_api_client_storage_prefix__'] || ${JSON.stringify(
      process.env.API_CLIENT_STORAGE_PREFIX || '',
    )};`,
    `window['__nocobase_api_client_storage_type__'] = window['__nocobase_api_client_storage_type__'] || ${JSON.stringify(
      process.env.API_CLIENT_STORAGE_TYPE || '',
    )};`,
    `window['__nocobase_api_client_share_token__'] = window['__nocobase_api_client_share_token__'] || ${JSON.stringify(
      process.env.API_CLIENT_SHARE_TOKEN || 'false',
    )};`,
    `window['__nocobase_ws_url__'] = window['__nocobase_ws_url__'] || ${JSON.stringify(
      process.env.WEBSOCKET_URL || '',
    )};`,
    `window['__nocobase_ws_path__'] = window['__nocobase_ws_path__'] || ${JSON.stringify(process.env.WS_PATH || '')};`,
    `window['__esm_cdn_base_url__'] = window['__esm_cdn_base_url__'] || ${JSON.stringify(
      process.env.ESM_CDN_BASE_URL || 'https://esm.sh',
    )};`,
    `window['__esm_cdn_suffix__'] = window['__esm_cdn_suffix__'] || ${JSON.stringify(
      process.env.ESM_CDN_SUFFIX || '',
    )};`,
  ].join('\n');
}

function createDefineValues(v2PublicPath: string) {
  return {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'import.meta.env.BASE_URL': JSON.stringify(v2PublicPath),
    'import.meta.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || process.env.API_BASE_PATH || ''),
    'import.meta.env.API_CLIENT_STORAGE_PREFIX': JSON.stringify(process.env.API_CLIENT_STORAGE_PREFIX || ''),
    'import.meta.env.API_CLIENT_STORAGE_TYPE': JSON.stringify(process.env.API_CLIENT_STORAGE_TYPE || ''),
    'import.meta.env.API_CLIENT_SHARE_TOKEN': JSON.stringify(process.env.API_CLIENT_SHARE_TOKEN || 'false'),
    'import.meta.env.WS_URL': JSON.stringify(process.env.WEBSOCKET_URL || ''),
    'import.meta.env.WS_PATH': JSON.stringify(process.env.WS_PATH || ''),
    'import.meta.env.ESM_CDN_BASE_URL': JSON.stringify(process.env.ESM_CDN_BASE_URL || 'https://esm.sh'),
    'import.meta.env.ESM_CDN_SUFFIX': JSON.stringify(process.env.ESM_CDN_SUFFIX || ''),
  };
}

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';
  const appPublicPath = ensurePublicPath(process.env.APP_PUBLIC_PATH || '/');
  const apiBasePath = ensurePublicPath(process.env.API_BASE_PATH || '/api/');
  const v2PublicPath = ensurePublicPath(`${appPublicPath.replace(/\/$/, '')}/v2/`);
  const hmrPath = `${v2PublicPath.replace(/\/$/, '')}/__rspack_hmr`;
  const v2Port = toNumber(process.env.APP_V2_PORT, 13002);
  const hmrClientHost = process.env.RSPACK_HMR_CLIENT_HOST || 'localhost';
  const hmrClientPort = toNumber(process.env.RSPACK_HMR_CLIENT_PORT || process.env.APP_PORT, v2Port);
  const proxyTargetUrl = process.env.PROXY_TARGET_URL || `http://127.0.0.1:${process.env.APP_PORT || 13001}`;
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
      define: createDefineValues(v2PublicPath),
    },
    html: {
      template: path.resolve(__dirname, 'index.html'),
      scriptLoading: isBuild ? 'module' : 'defer',
      tags: [
        {
          tag: 'link',
          attrs: {
            rel: 'icon',
            href: `${v2PublicPath}favicon_no_exist.ico`,
          },
          publicPath: false,
          head: true,
          append: false,
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: `${v2PublicPath}global.css`,
          },
          publicPath: false,
          head: true,
          append: false,
        },
        {
          tag: 'script',
          children: createRuntimeHeadScript(v2PublicPath, isBuild),
          head: true,
          append: false,
        },
        {
          tag: 'script',
          attrs: {
            src: `${v2PublicPath}browser-checker.js?v=1`,
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
        root: path.resolve(__dirname, '../dist/client/v2'),
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
      assetPrefix: v2PublicPath,
      cleanDistPath: true,
      sourceMap: {
        js: isBuild ? false : 'eval-cheap-module-source-map',
        css: false,
      },
    },
    server: {
      base: v2PublicPath,
      host: '0.0.0.0',
      port: v2Port,
      compress: true,
      publicDir: {
        name: path.resolve(__dirname, 'public'),
      },
      proxy: {
        [apiBasePath]: {
          target: proxyTargetUrl,
          changeOrigin: true,
          ws: true,
          xfwd: true, // 这里会处理 X-Forwarded-For 头，添加客户端 IP 地址
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
      },
      historyApiFallback: {
        disableDotRule: true,
        index: `${v2PublicPath}index.html`,
      },
    },
    dev: {
      assetPrefix: v2PublicPath,
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
            cacheGroups: {
              antdEcosystem: {
                test: /[\\/]node_modules[\\/](?:rc-[^\\/]+|@rc-component[\\/][^\\/]+|@ant-design[\\/](?!(?:icons|icons-svg)[\\/])[^\\/]+)[\\/]/,
                name: 'vendor-antd-ecosystem',
                chunks: 'all',
                priority: 45,
                enforce: true,
                minSize: 0,
              },
              momentLocales: {
                test: /[\\/]node_modules[\\/]moment[\\/](?:locale[\\/]|moment\.js$)/,
                name: 'vendor-moment',
                chunks: 'all',
                priority: 44,
                enforce: true,
                minSize: 0,
              },
              lodashCjs: {
                test: /[\\/]node_modules[\\/]lodash[\\/]lodash\.js$/,
                name: 'vendor-lodash',
                chunks: 'all',
                priority: 43,
                enforce: true,
                minSize: 0,
              },
              ses: {
                test: /[\\/]node_modules[\\/]ses[\\/]/,
                name: 'vendor-ses',
                chunks: 'all',
                priority: 42,
                enforce: true,
                minSize: 0,
              },
              antdIcons: {
                test: /[\\/]node_modules[\\/]@ant-design[\\/](?:icons|icons-svg)[\\/]/,
                name: 'vendor-antd-icons',
                chunks: 'all',
                priority: 40,
                enforce: true,
                minSize: 0,
              },
              antd: {
                test: /[\\/]node_modules[\\/]antd[\\/]/,
                name: 'vendor-antd',
                chunks: 'all',
                priority: 30,
                enforce: true,
                minSize: 0,
              },
            },
          },
        };
        config.performance = false;
        config.stats = 'errors-warnings';
      },
    },
  };
});
