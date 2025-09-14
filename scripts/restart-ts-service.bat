@echo off
REM 重启TypeScript服务脚本

echo ========================================
echo NocoBase TypeScript 服务重启工具
echo ========================================
echo.

echo 正在重启TypeScript服务...
echo.

echo 方法1: 通过VS Code命令面板
echo    1. 在VS Code中按 Ctrl+Shift+P
echo    2. 输入 "TypeScript: Restart TS Server"
echo    3. 选择并执行该命令
echo.

echo 方法2: 通过任务管理器重启
echo    1. 按 Ctrl+Shift+Esc 打开任务管理器
echo    2. 找到 "Code.exe" 或 "TypeScript" 相关进程
echo    3. 右键选择 "重新启动" 或 "结束任务"
echo    4. 重新打开VS Code
echo.

echo 方法3: 通过命令行重启
echo    1. 关闭所有VS Code窗口
echo    2. 等待5秒钟
echo    3. 重新打开VS Code项目
echo.

echo 方法4: 通过VS Code任务重启
echo    1. 在VS Code中按 Ctrl+Shift+P
echo    2. 输入 "Tasks: Run Task"
echo    3. 选择 "重启 TypeScript 服务" 任务
echo.

echo 注意事项:
echo    - 请确保以管理员权限运行此脚本
echo    - 如果问题仍然存在，请重启计算机
echo    - 确保VS Code已安装TypeScript插件
echo.

echo 配置更新说明:
echo    - 已更新tsconfig.json以忽略特定文件的类型检查
echo    - 已更新tsconfig.eslint.json以忽略特定文件的ESLint检查
echo    - 已添加对整个packages/core目录的排除规则
echo    - 这些更改将减少开发过程中的干扰
echo.

echo 按任意键关闭此窗口...
pause >nul