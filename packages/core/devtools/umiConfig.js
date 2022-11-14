const { existsSync } = require('fs');
const { resolve } = require('path');
const packageJson = require('./package.json');
const fs = require('fs');

console.log('VERSION: ', packageJson.version);

function getUmiConfig() {
  const { APP_PORT, API_BASE_URL } = process.env;
  const API_BASE_PATH = process.env.API_BASE_PATH || '/api/';
  const PROXY_TARGET_URL = process.env.PROXY_TARGET_URL || `http://127.0.0.1:${APP_PORT}`;
  const LOCAL_STORAGE_BASE_URL = process.env.LOCAL_STORAGE_BASE_URL || '/storage/uploads/';

  function getLocalStorageProxy() {
    if (LOCAL_STORAGE_BASE_URL.startsWith('http')) {
      return {};
    }

    return {
      [LOCAL_STORAGE_BASE_URL]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
      },
    };
  }

  return {
    define: {
      'process.env.API_BASE_URL': API_BASE_URL || API_BASE_PATH,
      'process.env.APP_ENV': process.env.APP_ENV,
      'process.env.VERSION': packageJson.version,
    },
    // only proxy when using `umi dev`
    // if the assets are built, will not proxy
    proxy: {
      [API_BASE_PATH]: {
        target: PROXY_TARGET_URL,
        changeOrigin: true,
        pathRewrite: { [`^${API_BASE_PATH}`]: API_BASE_PATH },
      },
      // for local storage
      ...getLocalStorageProxy(),
    },
  };
}

function getNamespace() {
  const content = fs.readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8');
  const json = JSON.parse(content);
  return json.name;
}

function resolveNocobasePackagesAlias(config) {
  const coreDir = resolve(process.cwd(), './packages/core');
  if (!existsSync(coreDir)) {
    const namespace = getNamespace();
    console.log('NAMESPACE: ' + namespace);
    const plugins = fs.readdirSync(resolve(process.cwd(), './packages/plugins'));
    for (const package of plugins) {
      const packageSrc = resolve(process.cwd(), './packages/plugins/', package, 'src');
      if (existsSync(packageSrc)) {
        config.module.rules.get('ts-in-node_modules').include.add(packageSrc);
        config.resolve.alias.set(`@${namespace}/plugin-${package}`, packageSrc);
      }
    }
    return;
  }
  const cores = fs.readdirSync(coreDir);
  for (const package of cores) {
    const packageSrc = resolve(process.cwd(), './packages/core/', package, 'src');
    if (existsSync(packageSrc)) {
      config.module.rules.get('ts-in-node_modules').include.add(packageSrc);
      config.resolve.alias.set(`@nocobase/${package}`, packageSrc);
    }
  }
  const plugins = fs.readdirSync(resolve(process.cwd(), './packages/plugins'));
  for (const package of plugins) {
    const packageSrc = resolve(process.cwd(), './packages/plugins/', package, 'src');
    if (existsSync(packageSrc)) {
      config.module.rules.get('ts-in-node_modules').include.add(packageSrc);
      config.resolve.alias.set(`@nocobase/plugin-${package}`, packageSrc);
    }
  }
  const samples = fs.readdirSync(resolve(process.cwd(), './packages/samples'));
  for (const package of samples) {
    const packageSrc = resolve(process.cwd(), './packages/samples/', package, 'src');
    if (existsSync(packageSrc)) {
      config.module.rules.get('ts-in-node_modules').include.add(packageSrc);
      config.resolve.alias.set(`@nocobase/plugin-sample-${package}`, packageSrc);
    }
  }
  const pros = fs.readdirSync(resolve(process.cwd(), './packages/pro-plugins'));
  for (const package of pros) {
    const packageSrc = resolve(process.cwd(), './packages/pro-plugins/', package, 'src');
    if (existsSync(packageSrc)) {
      config.module.rules.get('ts-in-node_modules').include.add(packageSrc);
      config.resolve.alias.set(`@nocobase/plugin-pro-${package}`, packageSrc);
    }
  }
}

exports.getUmiConfig = getUmiConfig;
exports.resolveNocobasePackagesAlias = resolveNocobasePackagesAlias;
