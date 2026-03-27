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
const APP_PUBLIC_PATH_TEMPLATE = '{{env.APP_PUBLIC_PATH}}';

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
    `window['__webpack_public_path__'] = '{{env.CDN_BASE_URL}}';`,
    `window['__nocobase_public_path__'] = '${appPublicPath}';`,
    `window['__nocobase_api_base_url__'] = '{{env.API_BASE_URL}}';`,
    `window['__nocobase_api_client_storage_prefix__'] = '{{env.API_CLIENT_STORAGE_PREFIX}}';`,
    `window['__nocobase_api_client_storage_type__'] = '{{env.API_CLIENT_STORAGE_TYPE}}';`,
    `window['__nocobase_api_client_share_token__'] = {{env.API_CLIENT_SHARE_TOKEN}};`,
    `window['__nocobase_ws_url__'] = '{{env.WS_URL}}';`,
    `window['__nocobase_ws_path__'] = '{{env.WS_PATH}}';`,
    `window['__esm_cdn_base_url__'] = '{{env.ESM_CDN_BASE_URL}}';`,
    `window['__esm_cdn_suffix__'] = '{{env.ESM_CDN_SUFFIX}}';`,
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
  const resolvedAppPublicPath = ensurePublicPath(process.env.APP_PUBLIC_PATH, '/');
  const appPublicPath = isBuild ? APP_PUBLIC_PATH_TEMPLATE : resolvedAppPublicPath;
  const htmlPublicPath = isDev ? '/' : appPublicPath;
  const apiBasePath = ensurePublicPath(process.env.API_BASE_PATH, '/api/');
  const localStorageBasePath = ensurePublicPath(`${resolvedAppPublicPath}storage/uploads/`, '/storage/uploads/');
  const staticBasePath = ensurePublicPath(`${resolvedAppPublicPath}static/`, '/static/');
  const wsBasePath = ensurePublicPath(process.env.WS_PATH, '/ws/');
  const v2BasePath = ensurePublicPath(`${resolvedAppPublicPath.replace(/\/$/, '')}/v2/`, '/v2/');
  const clientPort = toNumber(process.env.APP_PORT, 13001);
  const v2Port = toNumber(process.env.APP_V2_PORT, clientPort + 2);
  const hmrPath = `${resolvedAppPublicPath.replace(/\/$/, '')}/__rspack_hmr`;
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
      assetPrefix: isBuild ? 'auto' : appPublicPath,
      cleanDistPath: true,
      sourceMap: {
        js: isBuild ? false : 'eval-cheap-module-source-map',
        css: false,
      },
    },
    server: {
      base: resolvedAppPublicPath,
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
        index: `${resolvedAppPublicPath}index.html`,
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
        config.optimization = {
          ...config.optimization,
          runtimeChunk: 'single',
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            minSize: 0,
            cacheGroups: {
              reactCore: {
                test: /[\\/]node_modules[\\/](?:react|react-dom|react-is|react-router|react-router-dom|scheduler|use-sync-external-store)[\\/]/,
                name: 'vendor-core',
                chunks: 'all',
                priority: 65,
                enforce: true,
                minSize: 0,
              },
              antdEcosystem: {
                test: /[\\/]node_modules[\\/](?:rc-[^\\/]+|@rc-component[\\/][^\\/]+|@ant-design[\\/](?!(?:icons|icons-svg)[\\/])[^\\/]+)[\\/]/,
                name: 'vendor-antd-ecosystem',
                chunks: 'all',
                priority: 60,
                enforce: true,
                minSize: 0,
              },
              momentLocales: {
                test: /[\\/]node_modules[\\/]moment[\\/](?:locale[\\/]|moment\.js$)/,
                name: 'vendor-moment',
                chunks: 'all',
                priority: 59,
                enforce: true,
                minSize: 0,
              },
              lodashCjs: {
                test: /[\\/]node_modules[\\/]lodash(?:-es)?[\\/]/,
                name: 'vendor-lodash',
                chunks: 'all',
                priority: 58,
                enforce: true,
                minSize: 0,
              },
              ses: {
                test: /[\\/]node_modules[\\/]ses[\\/]/,
                name: 'vendor-ses',
                chunks: 'all',
                priority: 57,
                enforce: true,
                minSize: 0,
              },
              antdIcons: {
                test: /[\\/]node_modules[\\/]@ant-design[\\/](?:icons|icons-svg)[\\/]/,
                name: 'vendor-antd-icons',
                chunks: 'all',
                priority: 56,
                enforce: true,
                minSize: 0,
              },
              antd: {
                test: /[\\/]node_modules[\\/]antd[\\/]/,
                name: 'vendor-antd',
                chunks: 'all',
                priority: 55,
                enforce: true,
                minSize: 0,
              },
              antv: {
                test: /[\\/]node_modules[\\/]@antv[\\/]/,
                name: 'vendor-antv',
                chunks: 'all',
                priority: 54,
                enforce: true,
                minSize: 0,
              },
              markdownEcosystem: {
                test: /[\\/]node_modules[\\/](?:vditor|mermaid|markdown-it|markdown-it-highlightjs|highlight\.js|linkify-it|mdurl|uc\.micro|dompurify)[\\/]/,
                name: 'vendor-markdown',
                chunks: 'all',
                priority: 53,
                enforce: true,
                minSize: 0,
              },
              mathTemplate: {
                test: /[\\/]node_modules[\\/](?:mathjs|decimal\.js|fraction\.js|complex\.js|typed-function|escape-latex|javascript-natural-sort|seedrandom|jstat|liquidjs|handlebars|handlebars-utils|@budibase[\\/]handlebars-helpers)[\\/]/,
                name: 'vendor-math-template',
                chunks: 'all',
                priority: 52,
                enforce: true,
                minSize: 0,
              },
              editorEcosystem: {
                test: /[\\/]node_modules[\\/](?:slate|slate-react|slate-history|quill|react-quill|quill-image-resize-module-react|codemirror|@codemirror[\\/]|@lezer[\\/])/,
                name: 'vendor-editor',
                chunks: 'all',
                priority: 51,
                enforce: true,
                minSize: 0,
              },
              mobileUi: {
                test: /[\\/]node_modules[\\/](?:antd-mobile|antd-mobile-icons)[\\/]/,
                name: 'vendor-mobile-ui',
                chunks: 'all',
                priority: 50,
                enforce: true,
                minSize: 0,
              },
              dayjs: {
                test: /[\\/]node_modules[\\/]dayjs[\\/]/,
                name: 'vendor-dayjs',
                chunks: 'all',
                priority: 49,
                enforce: true,
                minSize: 0,
              },
              elk: {
                test: /[\\/]node_modules[\\/](?:elkjs|dagre-d3-es|graphlib|cytoscape|cytoscape-cose-bilkent|html5-qrcode)[\\/]/,
                name: 'vendor-diagram',
                chunks: 'all',
                priority: 48,
                enforce: true,
                minSize: 0,
              },
              commons: {
                name: 'commons',
                test: /[\\/]src[\\/]/,
                chunks: 'async',
                minChunks: 2,
                priority: 5,
                minSize: 20 * 1024,
              },
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendor-misc',
                chunks: 'all',
                priority: 10,
                minSize: 50 * 1024,
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
