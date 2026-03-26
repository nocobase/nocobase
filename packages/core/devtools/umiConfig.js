const packageJson = require('./package.json');
const { resolvePublicPath, resolveV2PublicPath } = require('../cli/src/util');
const { getPackagePaths, IndexGenerator, generatePlugins, generateAllPlugins } = require('./common.js');

console.log('VERSION: ', packageJson.version);

function getUmiConfig() {
  const {
    APP_PORT,
    APP_V2_PORT,
    API_BASE_URL,
    API_CLIENT_STORAGE_TYPE,
    API_CLIENT_STORAGE_PREFIX,
    APP_PUBLIC_PATH,
  } = process.env;
  const API_BASE_PATH = process.env.API_BASE_PATH || '/api/';
  const normalizedAppPublicPath = resolvePublicPath(APP_PUBLIC_PATH || '/');
  const V2_PUBLIC_PATH = resolveV2PublicPath(APP_PUBLIC_PATH || '/');
  const PROXY_TARGET_URL = process.env.PROXY_TARGET_URL || `http://127.0.0.1:${APP_PORT}`;
  const LOCAL_STORAGE_BASE_URL = 'storage/uploads/';
  const STATIC_PATH = 'static/';

  function getLocalStorageProxy() {
    if (LOCAL_STORAGE_BASE_URL.startsWith('http')) {
      return {};
    }

    return {
      [normalizedAppPublicPath + LOCAL_STORAGE_BASE_URL]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
      },
      [normalizedAppPublicPath + STATIC_PATH]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
      },
    };
  }

  function getClientV2Proxy() {
    if (!APP_V2_PORT) {
      return {};
    }

    return {
      [V2_PUBLIC_PATH]: {
        target: `http://127.0.0.1:${APP_V2_PORT}`,
        changeOrigin: true,
        ws: true,
        pathRewrite: { [`^${V2_PUBLIC_PATH}`]: V2_PUBLIC_PATH },
        onProxyReq: (proxyReq, req, res) => {
          if (req?.ip) {
            proxyReq.setHeader('X-Forwarded-For', req.ip);
          }
        },
      },
    };
  }

  return {
    alias: getPackagePaths().reduce((memo, item) => {
      memo[item[0]] = item[1];
      return memo;
    }, {}),
    define: {
      'process.env.APP_PUBLIC_PATH': process.env.APP_PUBLIC_PATH,
      'process.env.WS_PATH': process.env.WS_PATH,
      'process.env.API_BASE_URL': API_BASE_URL || API_BASE_PATH,
      'process.env.API_CLIENT_STORAGE_PREFIX': API_CLIENT_STORAGE_PREFIX,
      'process.env.API_CLIENT_STORAGE_TYPE': API_CLIENT_STORAGE_TYPE,
      'process.env.API_CLIENT_SHARE_TOKEN': process.env.API_CLIENT_SHARE_TOKEN || 'false',
      'process.env.APP_ENV': process.env.APP_ENV,
      'process.env.VERSION': packageJson.version,
      'process.env.WEBSOCKET_URL': process.env.WEBSOCKET_URL,
      'process.env.__E2E__': process.env.__E2E__,
    },
    // only proxy when using `umi dev`
    // if the assets are built, will not proxy
    proxy: {
      [API_BASE_PATH]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
        pathRewrite: { [`^${API_BASE_PATH}`]: API_BASE_PATH },
        onProxyRes(proxyRes, req, res) {
          if (req.headers.accept === 'text/event-stream') {
            res.writeHead(res.statusCode, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-transform',
              Connection: 'keep-alive',
            });
          }
        },
        onProxyReq: (proxyReq, req, res) => {
          if (req?.ip) {
            proxyReq.setHeader('X-Forwarded-For', req.ip);
          }
        },
      },
      // for local storage
      ...getLocalStorageProxy(),
      // v2 shell dev server proxy
      ...getClientV2Proxy(),
    },
  };
}

function resolveNocobasePackagesAlias(config) {
  const pkgs = getPackagePaths();
  for (const [pkg, dir] of pkgs) {
    config.module.rules.get('ts-in-node_modules').include.add(dir);
    config.resolve.alias.set(pkg, dir);
  }
}

exports.getUmiConfig = getUmiConfig;
exports.resolveNocobasePackagesAlias = resolveNocobasePackagesAlias;
exports.IndexGenerator = IndexGenerator;
exports.generatePlugins = generatePlugins;
exports.generateAllPlugins = generateAllPlugins;
