import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginSitemap } from '@rspress/plugin-sitemap';
import * as path from 'node:path';

const base = process.env.DOCS_BASE || '/';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  outDir: path.join(__dirname, 'dist'),
  themeDir: path.join(__dirname, 'theme'),
  base,
  // title: 'NocoBase Documentation',
  icon: 'https://www.nocobase.com/images/favicon/apple-touch-icon.png',
  logo: {
    light: '/LogoBlack.png',
    dark: '/LogoWhite.png',
  },
  builderConfig: {
    plugins: [pluginSass()],
    resolve: {
      alias: {
        // Force single React copy used by main docs runtime
        react: path.join(__dirname, '../node_modules/react'),
        'react-dom': path.join(__dirname, '../node_modules/react-dom'),
        'react/jsx-runtime': path.join(
          __dirname,
          '../node_modules/react/jsx-runtime',
        ),
        'react/jsx-dev-runtime': path.join(
          __dirname,
          '../node_modules/react/jsx-dev-runtime',
        ),
        // Shims for browser: avoid Node-only deps in helpers
        '@budibase/handlebars-helpers': path.join(
          __dirname,
          'shims/budibase-handlebars-helpers.js',
        ),
        url: path.join(__dirname, 'shims/url.js'),
        // 优先指向已构建产物，减少编译与语法兼容成本
        '@nocobase/client': path.join(__dirname, '../packages/core/client/es'),
        '@nocobase/flow-engine': path.join(
          __dirname,
          '../packages/core/flow-engine',
        ),
        '@nocobase/shared': path.join(__dirname, '../packages/core/shared'),
        '@nocobase/sdk': path.join(__dirname, '../packages/core/sdk'),
        '@nocobase/utils': path.join(__dirname, '../packages/core/utils'),
        '@nocobase/evaluators': path.join(
          __dirname,
          '../packages/core/evaluators',
        ),
        // 仍保留 v2 的源码别名（如有需要）
        '@nocobase/client-v2': path.join(
          __dirname,
          '../packages/core/client-v2/src',
        ),
      },
    },
  },
  plugins: [
    pluginPreview({
      previewMode: 'iframe',
      iframeOptions: {
        devPort: Number(process.env.RP_PREVIEW_PORT || '8899'),
        builderConfig: {
          output: {
            // 使用 ESM script，避免全局作用域下的变量冲突（如 module 重复声明）
            scriptType: 'module',
          },
          dev: {
            // 关闭 HMR，避免在预览入口里注入 module.hot 相关包装造成的顶层符号冲突
            hmr: false,
          },
          resolve: {
            alias: {
              // Ensure preview iframe uses the same single React instance
              react: path.join(__dirname, '../node_modules/react'),
              'react-dom': path.join(__dirname, '../node_modules/react-dom'),
              'react/jsx-runtime': path.join(
                __dirname,
                '../node_modules/react/jsx-runtime',
              ),
              'react/jsx-dev-runtime': path.join(
                __dirname,
                '../node_modules/react/jsx-dev-runtime',
              ),
              '@budibase/handlebars-helpers': path.join(
                __dirname,
                'shims/budibase-handlebars-helpers.js',
              ),
              url: path.join(__dirname, 'shims/url.js'),
              // 预览 iframe 构建需与主站保持一致的本地别名
              '@nocobase/client': path.join(
                __dirname,
                '../packages/core/client/es',
              ),
              '@nocobase/flow-engine': path.join(
                __dirname,
                '../packages/core/flow-engine',
              ),
              '@nocobase/shared': path.join(
                __dirname,
                '../packages/core/shared',
              ),
              '@nocobase/sdk': path.join(__dirname, '../packages/core/sdk'),
              '@nocobase/utils': path.join(__dirname, '../packages/core/utils'),
              '@nocobase/evaluators': path.join(
                __dirname,
                '../packages/core/evaluators',
              ),
              '@nocobase/client-v2': path.join(
                __dirname,
                '../packages/core/client-v2/src',
              ),
            },
          },
        },
      },
    }),
    pluginLlms(),
    pluginSitemap({
      siteUrl: 'https://docs.nocobase.com', // 替换为你的网站 URL
    }),
  ],
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'NocoBase Documentation',
      description: 'Helping you learn and master NocoBase quickly',
    },
    {
      lang: 'cn',
      label: '简体中文',
      title: 'NocoBase 文档',
      description: '帮助你快速学习和掌握 NocoBase',
    },
  ],
  lang: 'cn',
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/nocobase/nocobase',
      },
    ],
  },
});
