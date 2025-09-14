@echo off
echo 验证TypeScript错误是否已解决...
echo.

echo 检查已删除的文件是否存在...
if exist "packages\plugins\@nocobase\plugin-users\src\server\__tests__\utils.ts" (
    echo 错误：文件仍然存在
    exit /b 1
) else (
    echo 成功：文件已正确删除
)

echo.
echo 验证完成。
pause
