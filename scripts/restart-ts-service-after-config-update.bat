@echo off
REM 在配置更新后重启 TypeScript 服务的脚本

echo 正在重启 TypeScript 服务以应用配置更改...
echo.

echo 步骤 1: 关闭当前的 TypeScript 服务
echo 如果您在 VS Code 中，请按 Ctrl+Shift+P，然后输入 "TypeScript: Restart TS Server"
echo 或者您可以关闭并重新打开 VS Code
echo.

echo 步骤 2: 清理 TypeScript 缓存
echo 删除 .tsbuildinfo 文件和 TypeScript 缓存...
for /f "delims=" %%i in ('dir /s /b *.tsbuildinfo 2^>nul') do del "%%i"
echo.

echo 步骤 3: 验证配置更改
echo 检查 tsconfig.json 和 tsconfig.eslint.json 中的更改...
node -e "try { const config = require('./tsconfig.json'); console.log('tsconfig.json 配置加载成功'); } catch (e) { console.error('tsconfig.json 配置存在问题:', e.message); }"
node -e "try { const config = require('./tsconfig.eslint.json'); console.log('tsconfig.eslint.json 配置加载成功'); } catch (e) { console.error('tsconfig.eslint.json 配置存在问题:', e.message); }"
echo.

echo 配置更新完成！
echo 现在您应该不会再看到那些 TypeScript 错误了。
echo 如果仍然看到错误，请完全关闭并重新打开您的编辑器。
echo.

pause