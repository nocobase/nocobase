const fs = require('fs-extra');
const path = require('path');
const fg = require('fast-glob');

fs.removeSync(path.join(__dirname, 'packages', 'plugins', '@nocobase'), { recursive: true });
fs.removeSync(path.join(__dirname, 'packages', 'samples', '@nocobase'), { recursive: true });

const packages = fg.sync(['packages/plugins/*', 'packages/samples/*'], {
  cwd: process.cwd(),
  onlyDirectories: true,
  absolute: true,
});

fs.mkdirSync(path.join(__dirname, 'packages', 'plugins', '@nocobase'));
fs.mkdirSync(path.join(__dirname, 'packages', 'samples', '@nocobase'));

packages.forEach((package) => {
  const packageJsonPath = path.join(package, 'package.json');
  const packageJsonName = require(packageJsonPath).name;
  fs.moveSync(package, path.join(path.dirname(package), packageJsonName), { overwrite: true });
});
