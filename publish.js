const { readdir } = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');

const getDirectories = async (source) =>
  (await readdir(source, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((d) => d.name)
    .map((d) => path.resolve(source, d));

const packageDirs = ['packages/core', 'packages/plugins', 'packages/app'];

Promise.all(packageDirs.map((d) => getDirectories(d)))
  .then((res) => res.flat())
  .then((res) =>
    res.forEach((d) => {
      exec(`cd ${d} && npm unpublish -f; npm publish`, (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
      });
    }),
  );
