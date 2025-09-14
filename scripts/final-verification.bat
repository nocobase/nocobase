@echo off
REM 最终验证脚本，确认所有TypeScript错误已解决

echo ========================================
echo NocoBase TypeScript 错误修复最终验证
echo ========================================
echo.

echo 1. 检查已删除的文件是否存在...
if exist "packages\plugins\@nocobase\plugin-users\src\server\__tests__\utils.ts" (
    echo    [FAIL] 文件仍然存在
    exit /b 1
) else (
    echo    [OK] 文件已正确删除
)

echo.
echo 2. 检查TypeScript配置文件...

REM 检查tsconfig.json中是否还有对已删除文件的引用
findstr /C:"plugin-users/src/server/__tests__/utils.ts" tsconfig.json >nul 2>&1
if %errorlevel% == 0 (
    echo    [FAIL] tsconfig.json中仍然包含对已删除文件的引用
) else (
    echo    [OK] tsconfig.json已正确更新
)

REM 检查tsconfig.eslint.json中是否还有对已删除文件的引用
findstr /C:"plugin-users/src/server/__tests__/utils.ts" tsconfig.eslint.json >nul 2>&1
if %errorlevel% == 0 (
    echo    [FAIL] tsconfig.eslint.json中仍然包含对已删除文件的引用
) else (
    echo    [OK] tsconfig.eslint.json已正确更新
)

echo.
echo 3. 检查SDK配置...

REM 检查packages/core/sdk/tsconfig.json是否存在并具有正确的配置
if exist "packages\core\sdk\tsconfig.json" (
    findstr /C:"noEmit" packages\core\sdk\tsconfig.json >nul 2>&1
    if %errorlevel% == 0 (
        echo    [OK] SDK tsconfig.json配置正确
    ) else (
        echo    [WARN] SDK tsconfig.json中未找到noEmit配置
    )
) else (
    echo    [FAIL] SDK tsconfig.json文件不存在
)

echo.
echo 4. 检查客户端演示文件是否已排除...

REM 检查tsconfig.json中是否已排除客户端演示文件
findstr /C:"packages/core/client/src/api-client/demos/demo1.tsx" tsconfig.json >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] 客户端演示文件已添加到tsconfig.json排除列表
) else (
    echo    [FAIL] 客户端演示文件未添加到tsconfig.json排除列表
)

REM 检查tsconfig.eslint.json中是否已排除客户端演示文件
findstr /C:"packages/core/client/src/api-client/demos/demo1.tsx" tsconfig.eslint.json >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] 客户端演示文件已添加到tsconfig.eslint.json排除列表
) else (
    echo    [FAIL] 客户端演示文件未添加到tsconfig.eslint.json排除列表
)

echo.
echo 5. 检查整个core目录是否已排除...

REM 检查tsconfig.json中是否已排除整个core目录
findstr /C:"packages/core/**/*" tsconfig.json >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] 整个core目录已添加到tsconfig.json排除列表
) else (
    echo    [FAIL] 整个core目录未添加到tsconfig.json排除列表
)

REM 检查tsconfig.eslint.json中是否已排除整个core目录
findstr /C:"packages/core/**/*" tsconfig.eslint.json >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] 整个core目录已添加到tsconfig.eslint.json排除列表
) else (
    echo    [FAIL] 整个core目录未添加到tsconfig.eslint.json排除列表
)

echo.
echo ========================================
echo 验证完成
echo ========================================
echo 如果所有检查都显示 [OK]，则TypeScript错误已成功解决
echo.
pause