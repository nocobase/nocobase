/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const fs = require('fs');
const path = require('path');
const { rspack } = require('@rspack/core');

function ensurePublicPath(value) {
  let normalized = value || '/v2/';
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getWorkspaceAliases() {
  const aliases = {};
  const rootDir = path.resolve(__dirname, '../../../../');
  const tsconfigPathsPath = path.resolve(rootDir, 'tsconfig.paths.json');
  if (!fs.existsSync(tsconfigPathsPath)) {
    return aliases;
  }

  const tsconfigPaths = JSON.parse(fs.readFileSync(tsconfigPathsPath, 'utf-8'));
  const paths = tsconfigPaths?.compilerOptions?.paths || {};
  for (const [name, values] of Object.entries(paths)) {
    if (!Array.isArray(values) || values.length === 0 || name.includes('*')) {
      continue;
    }
    aliases[name] = path.resolve(rootDir, values[0]);
  }

  return aliases;
}

function createDefineValues(v2PublicPath) {
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

function createTemplateParameters(v2PublicPath) {
  return {
    BASE_URL: v2PublicPath,
    API_BASE_URL: process.env.API_BASE_URL || process.env.API_BASE_PATH || '',
    API_CLIENT_STORAGE_PREFIX: process.env.API_CLIENT_STORAGE_PREFIX || '',
    API_CLIENT_STORAGE_TYPE: process.env.API_CLIENT_STORAGE_TYPE || '',
    API_CLIENT_SHARE_TOKEN: process.env.API_CLIENT_SHARE_TOKEN || 'false',
    WS_URL: process.env.WEBSOCKET_URL || '',
    WS_PATH: process.env.WS_PATH || '',
    ESM_CDN_BASE_URL: process.env.ESM_CDN_BASE_URL || 'https://esm.sh',
    ESM_CDN_SUFFIX: process.env.ESM_CDN_SUFFIX || '',
  };
}

module.exports = (_env, argv = {}) => {
  const mode = argv.mode || process.env.NODE_ENV || 'development';
  const isBuild = mode === 'production';
  const appPublicPath = ensurePublicPath(process.env.APP_PUBLIC_PATH || '/');
  const v2PublicPath = ensurePublicPath(`${appPublicPath.replace(/\/$/, '')}/v2/`);
  const hmrPath = `${v2PublicPath.replace(/\/$/, '')}/__rspack_hmr`;
  const v2Port = toNumber(process.env.APP_V2_PORT || process.env.PORT, 13002);
  const hmrClientHost = process.env.RSPACK_HMR_CLIENT_HOST || 'localhost';
  const hmrClientPort = toNumber(process.env.RSPACK_HMR_CLIENT_PORT || process.env.APP_PORT, v2Port);
  const workspaceAliases = getWorkspaceAliases();

  return {
    mode,
    context: __dirname,
    entry: {
      index: [path.resolve(__dirname, 'src/polyfills/process.js'), path.resolve(__dirname, 'src/main.tsx')],
    },
    target: ['web', 'es2020'],
    output: {
      path: path.resolve(__dirname, '../dist/client/v2'),
      clean: true,
      publicPath: v2PublicPath,
      filename: 'assets/[name]-[contenthash:8].js',
      chunkFilename: 'assets/[name]-[contenthash:8].js',
      assetModuleFilename: 'assets/[name]-[contenthash:8][ext][query]',
      module: true,
      chunkFormat: 'module',
    },
    experiments: {
      outputModule: true,
    },
    devtool: isBuild ? false : 'eval-cheap-module-source-map',
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
      alias: {
        ...workspaceAliases,
        'process/browser': require.resolve('process/browser.js'),
      },
      fallback: {
        process: require.resolve('process/browser.js'),
        path: require.resolve('path-browserify'),
        querystring: require.resolve('querystring-es3'),
        fs: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /[\\/]node_modules[\\/]/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                sourceMap: !isBuild,
                jsc: {
                  parser: {
                    syntax: 'typescript',
                    tsx: true,
                    decorators: true,
                    dynamicImport: true,
                  },
                  transform: {
                    react: {
                      runtime: 'automatic',
                      development: !isBuild,
                      refresh: false,
                    },
                  },
                  target: 'es2020',
                },
              },
            },
          ],
        },
        {
          test: /\.jsx?$/,
          exclude: /[\\/]node_modules[\\/]/,
          use: [
            {
              loader: 'builtin:swc-loader',
              options: {
                sourceMap: !isBuild,
                jsc: {
                  parser: {
                    syntax: 'ecmascript',
                    jsx: true,
                    dynamicImport: true,
                  },
                  transform: {
                    react: {
                      runtime: 'automatic',
                      development: !isBuild,
                      refresh: false,
                    },
                  },
                  target: 'es2020',
                },
              },
            },
          ],
        },
        {
          test: /\.less$/,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'less-loader' }],
          type: 'javascript/auto',
        },
        {
          test: /\.css$/,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
          type: 'javascript/auto',
        },
        {
          test: /\.(png|jpe?g|gif|webp|ico)$/i,
          type: 'asset',
        },
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack'],
        },
      ],
    },
    plugins: [
      new rspack.DefinePlugin(createDefineValues(v2PublicPath)),
      new rspack.ProvidePlugin({
        process: require.resolve('process/browser.js'),
      }),
      new rspack.HtmlRspackPlugin({
        template: path.resolve(__dirname, 'index.html'),
        scriptLoading: 'module',
        minify: isBuild,
        templateParameters: createTemplateParameters(v2PublicPath),
      }),
    ],
    optimization: {
      // Keep one shared runtime when splitChunks is enabled in dev/prod.
      // Without this, entry may wait for vendor chunks that are loaded as separate module scripts
      // but not marked as fulfilled in the same runtime state, causing a blank page.
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          antdIcons: {
            test: /[\\/]node_modules[\\/]@ant-design[\\/]icons[\\/]/,
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
    },
    devServer: isBuild
      ? undefined
      : {
          host: '0.0.0.0',
          port: v2Port,
          allowedHosts: 'all',
          hot: true,
          liveReload: true,
          compress: true,
          historyApiFallback: {
            disableDotRule: true,
            rewrites: [{ from: /^\/.*$/, to: `${v2PublicPath}index.html` }],
          },
          static: false,
          devMiddleware: {
            publicPath: v2PublicPath,
          },
          client: {
            webSocketURL: {
              protocol: 'ws',
              hostname: hmrClientHost,
              port: hmrClientPort,
              pathname: hmrPath,
            },
          },
          webSocketServer: {
            options: {
              path: hmrPath,
            },
          },
        },
    performance: false,
    stats: 'errors-warnings',
  };
};
