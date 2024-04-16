const { exec } = require('child_process');
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

function addLicenseToFile(filePath) {
  const licenseText = getLicenseText(filePath);

  const data = fs.readFileSync(filePath, 'utf8');

  if (data.startsWith(licenseText)) return false;

  // 添加授权信息到文件内容的顶部
  const newData = licenseText + '\n\n' + data;

  // 将修改后的内容写回文件
  fs.writeFileSync(filePath, newData, 'utf8');

  return true;
}

// 执行 git diff 命令
exec('git diff --cached --name-only --diff-filter=ACM', (error, stdout, stderr) => {
  if (error) {
    console.error(`[nocobase]: git diff error ${error.message}`);
    process.exit(-1);
  }
  if (stderr) {
    console.error(`[nocobase]: git diff error ${stderr}`);
    process.exit(-1);
  }

  // 获取命令执行结果（文件列表）
  const files = stdout
    .split('\n')
    .filter(Boolean)
    .filter((file) => file.includes('/src/')) // 只检查 src 目录下的文件
    .filter((file) => file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'));

  const validFiles = files.filter((file) => addLicenseToFile(file));

  if (validFiles.length === 0) {
    return;
  }
  // 执行 git add 这些文件
  exec(`git add ${validFiles.join(' ')}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`[nocobase]: git add error ${error.message}`);
      process.exit(-1);
    }
    if (stderr) {
      console.error(`[nocobase]: git add error ${stderr}`);
      process.exit(-1);
    }
  });
});
