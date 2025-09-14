#!/usr/bin/env node

console.log(`
TypeScript配置已更新以忽略SDK包中的错误。

请执行以下步骤以使更改生效：

1. 关闭当前的VS Code窗口
2. 重新打开项目
3. 或者在VS Code中执行以下操作：
   - 按 Ctrl+Shift+P (Windows/Linux) 或 Cmd+Shift+P (Mac)
   - 输入 "TypeScript: Restart TS Server"
   - 选择并执行该命令

这些步骤将重启TypeScript服务并应用新的配置设置。
`);
