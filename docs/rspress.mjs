import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const argv = yargs(hideBin(process.argv)).parse()

// 从 process.argv 中移除 --lang 参数
process.argv = process.argv.filter((arg, index, arr) => {
  // 过滤掉 --lang 或 --lang=value 形式
  if (arg.startsWith('--lang')) {
    return false;
  }

  if (arg.startsWith('--check-dead-links')) {
    return false;
  }

  // 过滤掉 --lang 后面的值（如果前一个参数是 --lang）
  if (index > 0 && arr[index - 1] === '--lang') {
    return false;
  }
  return true;
});

if (!process.env.DOCS_LANG || argv.lang !== 'all') {
  process.env.DOCS_LANG = argv.lang || 'en';
}

if (!process.env.CHECK_DEAD_LINKS) {
  process.env.CHECK_DEAD_LINKS = argv.checkDeadLinks ? 'true' : 'false';
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildAllLanguages() {
  const docsPath = path.join(__dirname, 'docs');
  
  // 检查是否存在 docs 目录
  if (!fs.existsSync(docsPath)) {
    console.error('docs 目录不存在');
    return;
  }

  // 读取 docs 目录下的所有子目录
  let dirs = fs.readdirSync(docsPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  dirs = dirs.filter(dir => dir !== 'en');
  dirs.unshift('en');

  console.log(`找到语言目录: ${dirs.join(', ')}`);

  // 为每个语言目录执行构建
  for (const dir of dirs) {
    console.log(`\n开始构建 --lang=${dir}...`);
    
    await new Promise((resolve, reject) => {
      const child = spawn('yarn', ['docs', 'build', `--lang=${dir}`], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        shell: true
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✓ --lang=${dir} 构建完成`);
          resolve();
        } else {
          console.error(`✗ --lang=${dir} 构建失败，退出码: ${code}`);
          reject(new Error(`构建失败: ${dir}`));
        }
      });
    });
  }

  console.log('\n所有语言构建完成！');
}

// 检查是否需要构建所有语言
if (argv.lang === 'all') {
  buildAllLanguages().catch(console.error);
} else {
  // 正常执行 rspress 命令
  import('@rspress/core/dist/cli.js');
}
