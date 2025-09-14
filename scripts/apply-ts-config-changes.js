/**
 * 脚本用于提醒开发者重启 TypeScript 服务以使配置更改生效
 */

console.log('TypeScript 配置已更新！');
console.log('请执行以下操作以使更改生效：');
console.log('1. 关闭您的编辑器（如 VS Code）');
console.log('2. 重新打开编辑器');
console.log('3. 如果您使用的是 VS Code，可以按 Ctrl+Shift+P，然后输入 "TypeScript: Restart TS Server"');
console.log('4. 重新构建项目以确保所有更改都已应用');

// 如果在 Node.js 环境中运行，可以添加更多自动化操作
if (typeof process !== 'undefined') {
  console.log('\n您可以通过以下命令重新构建项目：');
  console.log('yarn build');
}
