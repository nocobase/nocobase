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
    const res = await axios.get(this.url(this.packageName), {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      responseType: 'json',
    });
    console.log(res.data);
    this.data = res.data;
  }

  getTarball(version = 'latest') {
    if (version === 'latest') {
      version = this.data['dist-tags']['latest'];
    } else if (version === 'next') {
      version = this.data['dist-tags']['next'];
    }
    return this.data.versions[version].dist.tarball;
  }

  async isCorePackage() {
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

  async download(options = {}) {
    if (await this.isCorePackage()) {
      console.log(this.packageName, 'is core package');
      return;
    }

    const { version } = options;
    await this.getInfo();
    const url = this.getTarball(version);
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
      // empty
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
    return res.data.data;
  }

  async download(options = {}) {
    const { version } = options;
    if (!this.token) {
      return;
    }
    const pkgs = await this.getProPackages();
    for (const pkg of pkgs) {
      await this.getPackage(pkg).download({ version });
    }
  }
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli
    .command('download-pro')
    .option('-V, --version [version]')
    .action(async (options) => {
      const baseURL = 'http://localhost:4873/';
      const credentials = { username: 'nocobase', password: 'nocobase' };
      const pm = new PackageManager({ baseURL });
      await pm.login(credentials);
      await pm.download({ version: 'latest' });
      await createStoragePluginsSymlink();
    });
};
