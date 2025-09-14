@echo off
REM 自动化重启TypeScript服务的批处理脚本
REM 以管理员模式运行

echo 正在重启TypeScript服务以应用SDK配置更改...
echo.

REM 检查是否以管理员权限运行
net session >nul 2>&1
if %errorLevel% == 0 (
    echo 已在管理员模式下运行
) else (
    echo 请以管理员模式运行此脚本
    echo 右键点击此批处理文件，选择"以管理员身份运行"
    pause
    exit /b
)

echo 显示TypeScript配置更新信息...
node scripts/restart-ts-sdk-service.js

echo.
echo 请按照上述说明操作以完成TypeScript服务重启。
echo.

pause
