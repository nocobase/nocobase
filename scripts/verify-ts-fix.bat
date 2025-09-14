@echo off
REM 验证TypeScript错误是否已解决的脚本

echo 验证TypeScript错误修复...
echo.

echo 检查已删除的文件是否存在...
if exist "packages\plugins\@nocobase\plugin-users\src\server\__tests__\utils.ts" (
    echo 错误：文件仍然存在
    exit /b 1
) else (
    echo 成功：文件已正确删除
)

echo.
echo 检查配置文件是否已更新...

REM 检查tsconfig.eslint.json
findstr /c:"packages/plugins/@nocobase/plugin-users/src/server/__tests__/utils.ts" tsconfig.eslint.json >nul
if %errorlevel% == 0 (
    echo 警告：tsconfig.eslint.json中仍然包含对已删除文件的引用
    echo 修复中...
    powershell -Command "(gc tsconfig.eslint.json) -replace 'packages/plugins/@nocobase/plugin-users/src/server/__tests__/utils\.ts', '' | Out-File -encoding ASCII tsconfig.eslint.json"
    echo 已修复tsconfig.eslint.json
) else (
    echo 成功：tsconfig.eslint.json已正确更新
)

REM 检查tsconfig.json
findstr /c:"packages/plugins/@nocobase/plugin-users/src/server/__tests__/utils.ts" tsconfig.json >nul
if %errorlevel% == 0 (
    echo 警告：tsconfig.json中仍然包含对已删除文件的引用
    echo 修复中...
    powershell -Command "(gc tsconfig.json) -replace 'packages/plugins/@nocobase/plugin-users/src/server/__tests__/utils\.ts', '' | Out-File -encoding ASCII tsconfig.json"
    echo 已修复tsconfig.json
) else (
    echo 成功：tsconfig.json已正确更新
)

echo.
echo TypeScript错误修复验证完成。
echo.

pause
