const fs = require('fs/promises');
const Path = require('path');
const { exec } = require('child_process');
const glob = require('glob');
const { Command, Option } = require('commander');
const { parse } = require('@nocobase/utils');

async function addEnKeysFromZh(filePath) {
  const enFilePath = filePath.replace(/zh-CN.json$/, 'en-US.json');

  const content = await fs.readFile(filePath, 'utf8');
  const json = JSON.parse(content);
  const keys = Object.keys(json);
  let enFileExists;
  try {
    enFileExists = await fs.stat(enFilePath);
  } catch (error) {}

  if (enFileExists) {
    const enContent = await fs.readFile(enFilePath, 'utf8');
    const enJsonKeys = Object.keys(JSON.parse(enContent));
    const keysSet = new Set(enJsonKeys);
    if (enJsonKeys.length !== keysSet.size) {
      return null;
    }
    if (keys.every((key) => keysSet.has(key))) {
      return null;
    }
  }

  const enJson = keys.reduce((result, key) => {
    result[key] = key;
    return result;
  }, {});

  // 将修改后的内容写回文件
  await fs.writeFile(enFilePath, JSON.stringify(enJson, null, 2), 'utf8');

  return enFilePath;
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

async function main({ mode, baseLang }) {
  const isMerge = await isMergeCommit();
  if (isMerge) return;
  const files = [];

  if (mode === 'diff') {
    const diffFiles = await getDiffFiles();
    files.push(
      ...diffFiles.filter(
        (file) => file.includes(`${Path.sep}src${Path.sep}`) && file.endsWith(`${Path.sep}${baseLang}.json`),
      ),
    );
  } else if (mode === 'all') {
    const pattern = `./packages/**/src/**/locale/${baseLang}.json`;
    const ignore = (await fs.readFile('.gitignore', 'utf8')).split('\n').filter(Boolean);
    const paths = glob.sync(pattern, {
      root: process.cwd(),
      ignore,
    });
    files.push(...paths);
  }

  const validFiles = [];

  for (const file of files) {
    const res = await addEnKeysFromZh(file);
    if (res) {
      validFiles.push(file);
    }
  }

  if (validFiles.length === 0) {
    console.log('No locale files need to be added, exit.');
    return;
  }

  // 执行 git add 这些文件
  await gitAddFiles(validFiles);
}

const cli = new Command();

cli
  // .arguments('[patterns...]')
  .addOption(new Option('-m, --mode <mode>', 'source mode').choices(['diff', 'all']).default('diff'))
  .option('-b, --base-lang <baseLang>', 'base language, default is zh-CN', 'zh-CN')
  // .option('-t, --target-lang <targetLang>', 'target language, default is en-US', 'en-US')
  // .option('-p, --search-pattern <pattern>', 'search pattern, default is "src/**/locale/{{baseLang}}.json"', 'src/**/locale/{{baseLang}}.json')
  .action(main);

cli
  .parseAsync(process.argv)
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
