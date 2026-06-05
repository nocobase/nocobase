const path = require('path');
const fs = require('fs-extra');

// 递归获取对象中所有的 key 路径
function getAllKeys(obj, prefix = '') {
  const keys = [];
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    for (const key in obj) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...getAllKeys(obj[key], fullPath));
      } else {
        keys.push(fullPath);
      }
    }
  }
  return keys;
}

// 根据路径获取嵌套对象的值
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}

// 根据路径设置嵌套对象的值
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

// 排序 JSON 对象
function sortJSON(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortJSON);
  } else if (typeof obj === 'object' && obj !== null) {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObject = {};
    sortedKeys.forEach((key) => {
      sortedObject[key] = sortJSON(obj[key]);
    });
    return sortedObject;
  }
  return obj;
}

async function main() {
  const latestDir = path.resolve(__dirname);
  const betaDir = path.resolve('/Users/chen/NocoBase/gitflow/nocobase/nocobase-2-beta/locales');

  console.log('Latest locales directory:', latestDir);
  console.log('Beta locales directory:', betaDir);

  // 检查 beta 目录是否存在
  if (!(await fs.pathExists(betaDir))) {
    console.error(`Error: Beta directory ${betaDir} does not exist.`);
    process.exit(1);
  }

  // 获取所有 JSON 语言文件
  const latestFiles = await fs.readdir(latestDir);
  const jsonFiles = latestFiles.filter((file) => file.endsWith('.json'));

  console.log(`\nFound ${jsonFiles.length} locale files to process:`);
  jsonFiles.forEach((file) => console.log(`  - ${file}`));

  let totalUpdated = 0;
  let totalKeys = 0;

  // 处理每个语言文件
  for (const file of jsonFiles) {
    const latestPath = path.resolve(latestDir, file);
    const betaPath = path.resolve(betaDir, file);

    // 检查 beta 版本是否存在对应的文件
    if (!(await fs.pathExists(betaPath))) {
      console.log(`\n⚠️  ${file}: Beta version not found, skipping...`);
      continue;
    }

    try {
      // 读取两个版本的文件
      const latestContent = await fs.readJSON(latestPath);
      const betaContent = await fs.readJSON(betaPath);

      // 获取 latest 版本的所有 key 路径
      const latestKeys = getAllKeys(latestContent);
      totalKeys += latestKeys.length;

      // 统计更新的 key
      let updatedCount = 0;
      const updatedKeys = [];

      // 对于每个 key，如果 beta 版本也存在，就用 beta 版本的值更新
      for (const keyPath of latestKeys) {
        const betaValue = getNestedValue(betaContent, keyPath);
        if (betaValue !== undefined) {
          const latestValue = getNestedValue(latestContent, keyPath);
          // 只有当值不同时才更新
          if (JSON.stringify(latestValue) !== JSON.stringify(betaValue)) {
            setNestedValue(latestContent, keyPath, betaValue);
            updatedCount++;
            updatedKeys.push(keyPath);
          }
        }
      }

      if (updatedCount > 0) {
        // 排序并保存
        const sortedContent = sortJSON(latestContent);
        await fs.writeFile(latestPath, JSON.stringify(sortedContent, null, 2) + '\n');
        console.log(`\n✅ ${file}: Updated ${updatedCount} keys`);
        if (updatedCount <= 10) {
          updatedKeys.forEach((key) => console.log(`   - ${key}`));
        } else {
          updatedKeys.slice(0, 10).forEach((key) => console.log(`   - ${key}`));
          console.log(`   ... and ${updatedCount - 10} more keys`);
        }
        totalUpdated += updatedCount;
      } else {
        console.log(`\n✓ ${file}: No updates needed (all keys are already up to date)`);
      }
    } catch (error) {
      console.error(`\n❌ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Summary:`);
  console.log(`  Total files processed: ${jsonFiles.length}`);
  console.log(`  Total keys checked: ${totalKeys}`);
  console.log(`  Total keys updated: ${totalUpdated}`);
  console.log(`${'='.repeat(60)}`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
