const fg = require('fast-glob');
const fs = require('fs');
const path = require('path');

const commercialLicense = `
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */
`.trim();
const openSourceLicense = `
/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
`.trim();

function getLicenseText(packageDir) {
  return packageDir.includes('/pro-plugins') ? commercialLicense : openSourceLicense;
}

function addLicenseToFile(filePath, licenseText) {
  const data = fs.readFileSync(filePath, 'utf8');

  if (data.includes(licenseText)) {
    return;
  }

  // 添加授权信息到文件内容的顶部
  const newData = licenseText + '\n\n' + data;

  // 将修改后的内容写回文件
  fs.writeFile(filePath, newData, 'utf8', (err) => {
    if (err) {
      console.error('写入文件时发生错误:', err);
      return;
    }
  });
}

async function addToPackageSource(packageDir) {
  const stream = fg.globStream('**/*.{js,jsx,ts,tsx,d.ts}', {
    cwd: path.join(packageDir, 'src'),
    ignore: ['**/demos'],
    absolute: true,
    onlyFiles: true,
  });

  console.log('package', path.basename(packageDir));

  const licenseText = getLicenseText(packageDir);
  for await (const filePath of stream) {
    addLicenseToFile(filePath, licenseText);
  }
}

function getPackages() {
  return fg
    .sync(['*/*/package.json', '*/*/*/package.json'], {
      cwd: path.join(__dirname, './packages'),
      absolute: true,
      onlyFiles: true,
    })
    .map((item) => path.join(path.dirname(item)));
}

async function run() {
  const packages = getPackages();
  for (const package of packages) {
    await addToPackageSource(package);
  }
}

run();
