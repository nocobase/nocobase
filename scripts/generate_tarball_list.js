#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function findPackageJson(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const pkgPath = path.join(full, 'package.json');
      if (fs.existsSync(pkgPath)) {
        results.push(pkgPath);
      } else {
        results.push(...findPackageJson(full));
      }
    }
  }
  return results;
}

const packageFiles = [path.join(root, 'package.json'), ...findPackageJson(path.join(root, 'packages'))];

const packages = new Set();

for (const file of packageFiles) {
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const section of ['dependencies', 'devDependencies']) {
    const deps = pkg[section] || {};
    for (const [name, version] of Object.entries(deps)) {
      packages.add(`${name}@${version}`);
    }
  }
}

const list = Array.from(packages).sort().join('\n') + '\n';
const outFile = path.join(root, 'storage', 'tarball-list.txt');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, list);

