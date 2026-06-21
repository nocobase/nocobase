const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const configFile = path.join(rootDir, 'git-repos.json');

// 获取命令行参数作为 git 命令
const gitArgs = process.argv.slice(2);

if (gitArgs.length === 0) {
  console.log('Usage: node scripts/git-multi.js <git-command>');
  console.log('   or: yarn git-multi <git-command>');
  console.log('Example: node scripts/git-multi.js status');
  console.log('         yarn git-multi pull');
  console.log('\nConfiguration:');
  console.log('  Create a "git-repos.json" file in the root directory to configure repositories.');
  console.log('  Format: { "repos": ["path/to/repo1", "path/to/repo2"] }');
  console.log('  If no config file is found, it will scan default locations.');
  process.exit(1);
}

function getGitRepos() {
  let repos = [];
  let usedConfig = false;

  // 1. 尝试读取配置文件
  if (fs.existsSync(configFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      if (Array.isArray(config.repos)) {
        // 处理相对路径
        repos = config.repos.map((repoPath) => path.resolve(rootDir, repoPath));
        usedConfig = true;
      }
    } catch (e) {
      console.error('Error reading git-repos.json:', e);
    }
  }

  // 2. 如果没有配置或配置为空，使用默认扫描
  if (!usedConfig || repos.length === 0) {
    if (!usedConfig) {
      console.log('No git-repos.json found, scanning default directories...');
    }

    // 添加根目录
    if (fs.existsSync(path.join(rootDir, '.git'))) {
      repos.push(rootDir);
    }

    // 扫描 pro-plugins
    const proPluginsDir = path.join(rootDir, 'packages/pro-plugins/@nocobase');
    if (fs.existsSync(proPluginsDir)) {
      const dirs = fs.readdirSync(proPluginsDir);
      for (const dir of dirs) {
        const fullPath = path.join(proPluginsDir, dir);
        // 忽略 .DS_Store 等文件
        if (dir.startsWith('.')) continue;

        try {
          if (fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, '.git'))) {
            repos.push(fullPath);
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }

  return [...new Set(repos)]; // 去重
}

const repos = getGitRepos();

console.log(`Found ${repos.length} git repositories.`);

async function runGitCommand(repo, args) {
  const relativePath = path.relative(rootDir, repo);
  const repoName = relativePath || 'ROOT';

  // 使用颜色高亮仓库名
  console.log(`\n\x1b[36m--- [${repoName}] git ${args.join(' ')} ---\x1b[0m`);

  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      cwd: repo,
      stdio: 'inherit', // 直接输出到终端，保留颜色
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`\x1b[31m[${repoName}] exited with code ${code}\x1b[0m`);
      }
      resolve();
    });

    child.on('error', (err) => {
      console.error(`\x1b[31m[${repoName}] failed to start git: ${err.message}\x1b[0m`);
      resolve();
    });
  });
}

async function main() {
  for (const repo of repos) {
    await runGitCommand(repo, gitArgs);
  }
}

main();
