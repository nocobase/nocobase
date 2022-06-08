const fs = require('fs');
const tar = require('tar');
const axios = require('axios');
const chalk = require('chalk');
const crypto = require('crypto');
const { join } = require('path');
const { execa } = require('@umijs/utils');
const { unlink, writeFile, readFile } = require('fs').promises;

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

exports.updateJsonFile = async (target, fn) => {
  const content = await readFile(target, 'utf-8');
  const json = JSON.parse(content);
  await writeFile(target, JSON.stringify(fn(json), null, 2), 'utf-8');
};

exports.concat = (value, previous) => {
  return previous.concat([value]);
};
