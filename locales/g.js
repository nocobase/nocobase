const path = require('path');
const fg = require('fast-glob');
const fs = require('fs-extra');
const _ = require('lodash');
const deepmerge = require('deepmerge');

// 获取 cronstrue 和 react-js-cron 的翻译
// 这些函数需要从 CLI 包中引入，或者在这里实现简化版本
// 为了简化，这里先跳过，你可以根据需要添加

function sortJSON(json) {
  if (Array.isArray(json)) {
    return json.map(sortJSON);
  } else if (typeof json === 'object' && json !== null) {
    const sortedKeys = Object.keys(json).sort();
    const sortedObject = {};
    sortedKeys.forEach((key) => {
      sortedObject[key] = sortJSON(json[key]);
    });
    return sortedObject;
  }
  return json;
}

async function main() {
  // 从 storage/locales 目录向上找到项目根目录
  const projectRoot = path.resolve(__dirname, '../');
  const cwd = path.resolve(projectRoot, 'node_modules', '@nocobase');
  const outputDir = path.resolve(__dirname);

  console.log('Scanning locale files from:', cwd);
  console.log('Output directory:', outputDir);

  // 检查 node_modules/@nocobase 是否存在
  if (!(await fs.pathExists(cwd))) {
    console.error(`Error: Directory ${cwd} does not exist.`);
    console.error('Please make sure node_modules/@nocobase is installed.');
    process.exit(1);
  }

  // 扫描所有 locale 文件
  const files = await fg('*/src/locale/*.json', {
    cwd,
    onlyFiles: true,
    absolute: false,
  });

  console.log(`Found ${files.length} locale files`);

  let locales = {};

  // 读取所有文件并按语言和包名组织
  for (const file of files) {
    const localeName = path.basename(file, '.json').replace(/_/g, '-');
    const pkg = path.basename(path.dirname(path.dirname(path.dirname(file))));
    const packageName = `@nocobase/${pkg}`;

    const filePath = path.resolve(cwd, file);
    try {
      const content = await fs.readJSON(filePath);
      _.set(locales, [localeName, packageName], content);
      console.log(`Loaded: ${packageName} - ${localeName}`);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
    }
  }

  // 处理中文和英文的合并逻辑
  const zhCN = locales['zh-CN'];
  const enUS = locales['en-US'] || {};

  if (zhCN && enUS) {
    for (const key1 in zhCN) {
      for (const key2 in zhCN[key1]) {
        if (!_.get(enUS, [key1, key2])) {
          _.set(enUS, [key1, key2], key2);
        }
      }
    }
  }

  // 合并所有语言文件（以英文为基础）
  for (const locale of Object.keys(locales)) {
    if (enUS) {
      locales[locale] = deepmerge(enUS, locales[locale]);
    }
    // 如果需要添加 cronstrue 和 react-js-cron，可以在这里添加
    // locales[locale]['cronstrue'] = getCronstrueLocale(locale);
    // locales[locale]['react-js-cron'] = getReactJsCron(locale);
  }

  // 自定义合并函数：保留已存在的值，只添加新的 key
  function mergePreserveExisting(target, source) {
    if (typeof target !== 'object' || target === null || Array.isArray(target)) {
      // 如果目标不是对象，直接返回目标（保留已存在的值）
      return target;
    }
    if (typeof source !== 'object' || source === null || Array.isArray(source)) {
      // 如果源不是对象，返回目标（保留已存在的值）
      return target;
    }

    const result = { ...target };
    for (const key in source) {
      if (!(key in result)) {
        // 如果目标中不存在该键，添加它
        result[key] = source[key];
      } else if (
        typeof result[key] === 'object' &&
        typeof source[key] === 'object' &&
        result[key] !== null &&
        source[key] !== null &&
        !Array.isArray(result[key]) &&
        !Array.isArray(source[key])
      ) {
        // 递归合并嵌套对象
        result[key] = mergePreserveExisting(result[key], source[key]);
      }
      // 如果目标中已存在该键，保留目标值（不覆盖）
    }
    return result;
  }

  // 排序并写入文件
  locales = sortJSON(locales);
  await fs.mkdirp(outputDir);

  for (const locale of Object.keys(locales)) {
    const outputPath = path.resolve(outputDir, `${locale}.json`);

    // 如果输出文件已存在，先读取它
    let existingContent = {};
    if (await fs.pathExists(outputPath)) {
      try {
        existingContent = await fs.readJSON(outputPath);
        console.log(`Found existing ${locale}.json, preserving existing keys`);
      } catch (error) {
        console.warn(`Warning: Could not read existing ${locale}.json:`, error.message);
      }
    }

    // 合并：保留已存在的值，只添加新的 key
    const finalContent =
      Object.keys(existingContent).length > 0
        ? mergePreserveExisting(existingContent, locales[locale])
        : locales[locale];

    await fs.writeFile(outputPath, JSON.stringify(sortJSON(finalContent), null, 2));
    console.log(`Generated: ${outputPath}`);
  }

  console.log(`\nSuccessfully generated ${Object.keys(locales).length} locale files!`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
