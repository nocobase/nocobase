const fs = require('fs');
const tar = require('tar');
const axios = require('axios');
const chalk = require('chalk');
const crypto = require('crypto');
const BufferList = require('bl');
const { join } = require('path');
const { spawn } = require('child_process');
const { execa } = require('@umijs/utils');
const { unlink, writeFile, readFile } = require('fs').promises;

exports.spawnAsync = (...args) => {
  const child = spawn(...args);
  const stdout = child.stdout ? new BufferList() : '';
  const stderr = child.stderr ? new BufferList() : '';

  if (child.stdout) {
    child.stdout.on('data', (data) => {
      stdout.append(data);
    });
  }

  if (child.stderr) {
    child.stderr.on('data', (data) => {
      stderr.append(data);
    });
  }

  const promise = new Promise((resolve, reject) => {
    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        const err = new Error(`child exited with code ${code}`);
        err.code = code;
        err.stderr = stderr;
        err.stdout = stdout;
        reject(err);
      }
    });
  });

  promise.child = child;

  return promise;
};

exports.downloadPackageFromNpm = async (packageName, target) => {
  const { stdout } = await execa('npm', ['v', packageName, 'dist.tarball']);
  const tarballFile = join(target, '..', `${crypto.createHash('md5').update(packageName).digest('hex')}-tarball.gz`);
  const writer = fs.createWriteStream(tarballFile);
  console.log(chalk.gray(`URL: ${stdout}`));
  await axios.get(stdout, { responseType: 'stream' }).then((response) => {
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);

      let error = null;

      writer.on('error', (err) => {
        error = err;
        writer.close();
        reject(err);
      });

      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
      });
    });
  });

  await tar.x({
    file: tarballFile,
    gzip: true,
    cwd: target,
    strip: 1,
    k: true,
    // filter(path, entry) {
    //   return !(path.startsWith('package/lib') || path.startsWith('package/esm') || path.startsWith('package/dist'));
    // },
  });

  await unlink(tarballFile);
};

exports.updateJsonFile = async (target, data) => {
  const content = await readFile(target, 'utf-8');
  const json = JSON.parse(content);
  Object.keys(data).forEach((key) => {
    json[key] = data[key];
  });
  await writeFile(target, JSON.stringify(json, null, 2), 'utf-8');
};

exports.concat = (value, previous) => {
  return previous.concat([value]);
};
