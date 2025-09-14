@echo off
REM 最终验证脚本，检查所有TypeScript配置是否正确

echo ==========================================
echo NocoBase TypeScript 配置最终验证
echo ==========================================
echo.

echo 1. 检查主 tsconfig.json 配置...
node -e "try { const config = require('./tsconfig.json'); console.log('✓ tsconfig.json 配置加载成功'); } catch (e) { console.error('✗ tsconfig.json 配置存在问题:', e.message); }"
echo.

echo 2. 检查 ESLint TypeScript 配置...
node -e "try { const config = require('./tsconfig.eslint.json'); console.log('✓ tsconfig.eslint.json 配置加载成功'); } catch (e) { console.error('✗ tsconfig.eslint.json 配置存在问题:', e.message); }"
echo.

echo 3. 检查 SDK TypeScript 配置...
node -e "try { const config = require('./packages/core/sdk/tsconfig.json'); console.log('✓ packages/core/sdk/tsconfig.json 配置加载成功'); } catch (e) { console.error('✗ packages/core/sdk/tsconfig.json 配置存在问题:', e.message); }"
echo.

echo 4. 验证已删除的文件不存在...
if exist "packages\plugins\@nocobase\plugin-users\src\server\__tests__\utils.ts" (
    echo "✗ 错误：已删除的文件仍然存在"
) else (
    echo "✓ 已删除的文件不存在"
)
echo.

echo 5. 检查核心目录排除规则...
findstr /c:"packages/core/test/vitest.mjs" tsconfig.json >nul
if %errorlevel% == 0 (
    echo "✓ 核心目录排除规则已添加到 tsconfig.json"
) else (
    echo "✗ 未在 tsconfig.json 中找到核心目录排除规则"
)

findstr /c:"packages/core/test/vitest.mjs" tsconfig.eslint.json >nul
if %errorlevel% == 0 (
    echo "✓ 核心目录排除规则已添加到 tsconfig.eslint.json"
) else (
    echo "✗ 未在 tsconfig.eslint.json 中找到核心目录排除规则"
)
echo.

echo 6. 检查弃用警告修复...
findstr /c:"ignoreDeprecations" packages/core/sdk/tsconfig.json >nul
if %errorlevel% == 0 (
    echo "✓ ignoreDeprecations 配置已添加到 packages/core/sdk/tsconfig.json"
) else (
    echo "✗ 未在 packages/core/sdk/tsconfig.json 中找到 ignoreDeprecations 配置"
)
echo.

echo 7. 检查 noEmit 配置...
findstr /c:"noEmit.*true" tsconfig.json >nul
if %errorlevel% == 0 (
    echo "✓ noEmit 配置已正确设置"
) else (
    echo "✗ 未找到正确的 noEmit 配置"
)
echo.

echo ==========================================
echo 验证完成
echo ==========================================
echo.
echo 如果所有检查都显示为 ✓，则 TypeScript 配置已正确更新。
echo 您可能需要重启 TypeScript 服务以使更改生效。
echo 在 VS Code 中，您可以按 Ctrl+Shift+P，然后输入 "TypeScript: Restart TS Server"
echo.

pause