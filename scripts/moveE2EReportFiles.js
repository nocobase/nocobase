const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 源路径和目标路径
const sourcePattern = './e2e-report/blob-*/*';
const targetDir = './e2e-report/';

// 确保目标目录存在
fs.mkdirSync(targetDir, { recursive: true });

// 使用 glob 模块匹配文件
glob(sourcePattern, (err, files) => {
  if (err) {
    console.error('Error matching files:', err);
    return;
  }

  // 移动每个文件
  files.forEach((file) => {
    const targetFile = path.join(targetDir, path.basename(file));

    fs.rename(file, targetFile, (err) => {
      if (err) {
        console.error(`Error moving file ${file}:`, err);
      } else {
        console.log(`Moved file ${file} to ${targetDir}`);
      }
    });
  });
});
