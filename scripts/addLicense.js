const fs = require('fs/promises');
const { exec } = require('child_process');

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

async function addLicenseToFile(filePath) {
  const licenseText = getLicenseText(filePath);

  const data = await fs.readFile(filePath, 'utf8');

  if (data.startsWith(licenseText)) return false;

  // 添加授权信息到文件内容的顶部
  const newData = licenseText + '\n\n' + data;

  // 将修改后的内容写回文件
  await fs.writeFile(filePath, newData, 'utf8');

  return true;
}

function isMergeCommit() {
  return new Promise((resolve, reject) => {
    exec('git rev-parse --verify MERGE_HEAD', (error, stdout, stderr) => {
      if (error || stderr) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function getDiffFiles() {
  return new Promise((resolve, reject) => {
    exec('git diff --cached --name-only --diff-filter=ACM', (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      if (stderr) {
        reject(stderr);
      }
      resolve(stdout.split('\n').filter(Boolean));
    });
  });
}

function gitAddFiles(files) {
  return new Promise((resolve, reject) => {
    exec(`git add ${files.join(' ')}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      if (stderr) {
        reject(stderr);
      }
      resolve(stdout);
    });
  });
}

async function main() {
  const isMerge = await isMergeCommit();
  if (isMerge) return;

  const diffFiles = await getDiffFiles();
  const files = diffFiles
    .filter((file) => file.includes('/src/')) // 只检查 src 目录下的文件
    .filter((file) => !file.includes('/demos/')) // 忽略 demos 目录
    .filter((file) => file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx'));

  const validFiles = [];
  for (const file of files) {
    const res = await addLicenseToFile(file);
    if (res) {
      validFiles.push(file);
    }
  }

  if (validFiles.length === 0) {
    return;
  }

  // 执行 git add 这些文件
  await gitAddFiles(validFiles);
}

main();
