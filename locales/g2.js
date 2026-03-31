const path = require('path');
const fg = require('fast-glob');
const fs = require('fs-extra');

async function main() {
  // 从 storage/locales 目录向上找到项目根目录
  const projectRoot = path.resolve(__dirname, '../');
  const localesDir = path.resolve(__dirname);
  const nodeModulesDir = path.resolve(projectRoot, 'node_modules', '@nocobase');

  console.log('Project root:', projectRoot);
  console.log('Locales directory:', localesDir);
  console.log('Node modules directory:', nodeModulesDir);

  // 检查 node_modules/@nocobase 是否存在
  if (!(await fs.pathExists(nodeModulesDir))) {
    console.error(`Error: Directory ${nodeModulesDir} does not exist.`);
    console.error('Please make sure node_modules/@nocobase is installed.');
    process.exit(1);
  }

  // 扫描所有语言文件
  const localeFiles = await fg('*.json', {
    cwd: localesDir,
    onlyFiles: true,
    absolute: false,
  });

  console.log(`Found ${localeFiles.length} locale files`);

  // 处理每个语言文件
  for (const localeFile of localeFiles) {
    const localeName = path.basename(localeFile, '.json');
    const localeFilePath = path.resolve(localesDir, localeFile);

    console.log(`\nProcessing ${localeName}...`);

    try {
      const localeData = await fs.readJSON(localeFilePath);

      // 遍历每个包
      for (const packageName in localeData) {
        // 跳过特殊键（如 cronstrue, react-js-cron）
        if (packageName === 'cronstrue' || packageName === 'react-js-cron') {
          continue;
        }

        // 从包名提取包目录名
        // @nocobase/client -> client
        // @nocobase/plugin-acl -> plugin-acl
        if (!packageName.startsWith('@nocobase/')) {
          console.warn(`  Warning: Invalid package name format: ${packageName}`);
          continue;
        }

        const packageDirName = packageName.replace('@nocobase/', '');
        const packageDir = path.resolve(nodeModulesDir, packageDirName);

        // 检查包目录是否存在
        if (!(await fs.pathExists(packageDir))) {
          console.warn(`  Warning: Package directory does not exist: ${packageDirName}`);
          continue;
        }

        // 构建目标文件路径
        const targetDir = path.resolve(packageDir, 'src', 'locale');
        const targetFile = path.resolve(targetDir, `${localeName}.json`);

        // 确保目录存在
        await fs.mkdirp(targetDir);

        // 写入翻译文件
        await fs.writeFile(targetFile, JSON.stringify(localeData[packageName], null, 2));

        console.log(`  ✓ ${packageName} -> ${path.relative(projectRoot, targetFile)}`);
      }
    } catch (error) {
      console.error(`Error processing ${localeFile}:`, error.message);
    }
  }

  console.log(`\nSuccessfully wrote locale files back to node_modules/@nocobase!`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
