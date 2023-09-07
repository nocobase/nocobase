const { spawnSync } = require('child_process');
const fs = require('fs');

const appDirectory = 'my-nocobase-app';

// 检查文件夹是否存在
if (!fs.existsSync(appDirectory)) {
  try {
    spawnSync('yarn', ['create', 'nocobase-app', appDirectory], { stdio: 'inherit', shell: true });
  } catch (error) {
    console.error('Error creating directory:', error);
    process.exit(1);
  }
}

try {
  process.chdir(appDirectory);
  // 只安装必要的依赖
  spawnSync('yarn', ['install', '--production'], { stdio: 'inherit', shell: true });
  // 加上 -f 比较保险
  spawnSync('yarn', ['nocobase', 'install', '-f'], { stdio: 'inherit', shell: true });
  spawnSync('yarn', ['start'], { stdio: 'inherit', shell: true });
} catch (error) {
  console.error('Script execution error:', error);
}
