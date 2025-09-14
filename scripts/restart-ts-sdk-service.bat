@echo off
REM 以管理员模式重启TypeScript服务的批处理脚本

echo TypeScript配置已更新以忽略SDK包中的错误。
echo.

echo 请执行以下步骤以使更改生效：
echo.
echo 1. 关闭当前的VS Code窗口
echo 2. 重新打开项目
echo 3. 或者在VS Code中执行以下操作：
echo    - 按 Ctrl+Shift+P (Windows/Linux) 或 Cmd+Shift+P (Mac)
echo    - 输入 "TypeScript: Restart TS Server"
echo    - 选择并执行该命令
echo.
echo 这些步骤将重启TypeScript服务并应用新的配置设置。
echo.

pause
