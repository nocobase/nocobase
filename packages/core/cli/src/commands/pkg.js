/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { Command } = require('commander');
const axios = require('axios');
const fs = require('fs-extra');
const zlib = require('zlib');
const tar = require('tar');
const path = require('path');
const { createStoragePluginsSymlink } = require('@nocobase/utils/plugin-symlink');
const chalk = require('chalk');
const { getAccessKeyPair, showLicenseInfo, LicenseKeyError } = require('../util');

class Package {
  data;
  constructor(packageName, packageManager) {
    this.packageName = packageName;
    this.packageManager = packageManager;
    this.outputDir = path.resolve(process.cwd(), `storage/plugins/${this.packageName}`);
  }

  get token() {
    return this.packageManager.getToken();
  }

  url(path) {
    return this.packageManager.url(path);
  }

  async mkdir() {
    if (await fs.exists(this.outputDir)) {
      await fs.rm(this.outputDir, { recursive: true, force: true });
    }
    await fs.mkdirp(this.outputDir);
  }

  async getInfo() {
    try {
      const res = await axios.get(this.url(this.packageName), {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        responseType: 'json',
      });
      this.data = res.data;
    } catch (error) {
      return;
    }
  }

  getTarball(version = 'latest') {
    if (this.data.versions[version]) {
      return [version, this.data.versions[version].dist.tarball];
    }

    const keys = version.split('.');
    const length = keys.length;

    if (version.includes('rc')) {
      version = version.split('-').shift();
    }

    if (length === 5) {
      keys.pop();
      version = keys.join('.');
    }

    if (version === 'latest') {
      version = this.data['dist-tags']['latest'];
    } else if (version === 'next') {
      version = this.data['dist-tags']['next'];
    }

    if (!this.data.versions[version]) {
      console.log(chalk.redBright(`Download failed: ${this.packageName}@${version} package does not exist`));
    }

    return [version, this.data.versions[version].dist.tarball];
  }

  async isDevPackage() {
    let file = path.resolve(process.cwd(), 'packages/plugins', this.packageName, 'package.json');
    if (await fs.exists(file)) {
      return true;
    }
    file = path.resolve(process.cwd(), 'packages/pro-plugins', this.packageName, 'package.json');
    if (await fs.exists(file)) {
      return true;
    }
    return false;
  }

  async isDownloaded(version) {
    const packageFile = path.resolve(process.env.PLUGIN_STORAGE_PATH, this.packageName, 'package.json');
    if (await fs.exists(packageFile)) {
      const json = await fs.readJson(packageFile);
      if (json.version === version) {
        return true;
      }
    }
    return false;
  }

  async download(options = {}) {
    if (await this.isDevPackage()) {
      console.log(chalk.yellowBright(`Skipped: ${this.packageName} is dev package`));
      return;
    }
    if (await this.isDownloaded(options.version)) {
      return;
    }
    await this.getInfo();
    if (!this.data) {
      console.log(chalk.redBright(`Download failed: ${this.packageName} package does not exist`));
      return;
    }
    try {
      const [version, url] = this.getTarball(options.version);
      if (await this.isDownloaded(version)) {
        return;
      }
      const response = await axios({
        url,
        responseType: 'stream',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      await this.mkdir();
      await new Promise((resolve, reject) => {
        response.data
          .pipe(zlib.createGunzip()) // 解压 gzip
          .pipe(tar.extract({ cwd: this.outputDir, strip: 1 })) // 解压 tar
          .on('finish', resolve)
          .on('error', reject);
      });
      console.log(chalk.greenBright(`Downloaded: ${this.packageName}@${version}`));
    } catch (error) {
      console.log(chalk.redBright(`Download failed: ${this.packageName}`));
    }
  }
}

class PackageManager {
  token;
  baseURL;

  constructor({ baseURL }) {
    this.baseURL = baseURL;
  }

  getToken() {
    return this.token;
  }

  getBaseURL() {
    return this.baseURL;
  }

  url(path) {
    return this.baseURL + path;
  }

  async login(credentials) {
    try {
      const res1 = await axios.post(`${this.baseURL}-/verdaccio/sec/login`, credentials, {
        responseType: 'json',
      });
      this.token = res1.data.token;
    } catch (error) {
      if (error?.response?.data?.error === 'license not valid') {
        showLicenseInfo(LicenseKeyError.notValid);
      }
      console.error(chalk.redBright(`Login failed: ${this.baseURL}`));
    }
  }

  getPackage(packageName) {
    return new Package(packageName, this);
  }

  async getProPackages() {
    const res = await axios.get(this.url('pro-packages'), {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      responseType: 'json',
    });
    return {
      licensed_plugins: res.data?.data || [],
      commercial_plugins: res.data?.meta?.commercial_plugins || [],
    };
  }

  async getPackages() {
    const pkgs = await this.getProPackages();

    if (Array.isArray(pkgs)) {
      return {
        commercial_plugins: pkgs,
        licensed_plugins: pkgs,
      };
    }
    return pkgs;
  }

  async removePackage(packageName) {
    const dir = path.resolve(process.env.PLUGIN_STORAGE_PATH, packageName);
    const r = await fs.exists(dir);
    if (r) {
      console.log(chalk.yellowBright(`Removed: ${packageName}`));
      await fs.rm(dir, { force: true, recursive: true });
    }
  }

  async download(options = {}) {
    const { version } = options;
    if (!this.token) {
      return;
    }
    const { commercial_plugins, licensed_plugins } = await this.getPackages();
    for (const pkg of commercial_plugins) {
      if (!licensed_plugins.includes(pkg)) {
        await this.removePackage(pkg);
      }
    }
    for (const pkg of licensed_plugins) {
      await this.getPackage(pkg).download({ version });
    }
  }
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  const pkg = cli.command('pkg');
  pkg
    .command('download-pro')
    .option('-V, --version [version]')
    .action(async () => {
      const {
        NOCOBASE_PKG_URL = 'https://pkg.nocobase.com/',
        NOCOBASE_PKG_USERNAME,
        NOCOBASE_PKG_PASSWORD,
      } = process.env;
      let accessKeyId;
      let accessKeySecret;
      try {
        ({ accessKeyId, accessKeySecret } = await getAccessKeyPair());
      } catch (e) {
        return;
      }
      if (!(NOCOBASE_PKG_USERNAME && NOCOBASE_PKG_PASSWORD) && !(accessKeyId && accessKeySecret)) {
        return;
      }
      const credentials = accessKeyId
        ? { username: accessKeyId, password: accessKeySecret }
        : { username: NOCOBASE_PKG_USERNAME, password: NOCOBASE_PKG_PASSWORD };
      const pm = new PackageManager({ baseURL: NOCOBASE_PKG_URL });
      await pm.login(credentials);
      const file = path.resolve(__dirname, '../../package.json');
      const json = await fs.readJson(file);
      await pm.download({ version: json.version });
      await createStoragePluginsSymlink();
    });
  pkg.command('export-all').action(async () => {
    console.log('Todo...');
  });
};
