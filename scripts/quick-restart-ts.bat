@echo off
REM 快速重启TypeScript服务脚本
REM 用于应用配置更改

echo 正在重启TypeScript服务...
echo.

REM 提示用户在VS Code中重启TypeScript服务
echo 请在VS Code中执行以下操作：
echo 1. 按 Ctrl+Shift+P
echo 2. 输入 "TypeScript: Restart TS Server"
echo 3. 选择并执行该命令
echo.

echo 如果您希望自动执行此操作，请运行 auto-restart-ts-sdk-service.bat 脚本
echo.

pause
