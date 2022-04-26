const execa = require('execa');
const axios = require('axios');
const fs = require('fs');
const fsP = require('fs').promises;
const tar = require('tar');
const { join } = require('path');
const crypto = require('crypto');

module.exports = async (packageName, target) => {
  const viewResult = await execa('npm', ['v', packageName, 'dist.tarball']);
  const url = viewResult['stdout'];

  const tarballFile = join(target, '..', `${crypto.createHash('md5').update(packageName).digest('hex')}-tarball.gz`);

  const writer = fs.createWriteStream(tarballFile);

  await axios.get(url, { responseType: 'stream' }).then((response) => {
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

  const result = await tar.x({
    file: tarballFile,
    gzip: true,
    cwd: target,
    strip: 1,
    k: true,
    filter(path, entry) {
      return !(path.startsWith('package/lib') || path.startsWith('package/esm') || path.startsWith('package/dist'));
    },
  });

  await fsP.unlink(tarballFile);
};
