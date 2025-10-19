import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginSitemap } from '@rspress/plugin-sitemap';
import * as path from 'node:path';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  title: 'NocoBase Documentation',
  icon: 'https://www.nocobase.com/images/favicon/apple-touch-icon.png',
  logo: {
    light: '/LogoBlack.png',
    dark: '/LogoWhite.png',
  },
  builderConfig: {
    plugins: [pluginSass()],
    resolve: {
      alias: {
        '@nocobase/client-v2': path.join(__dirname, '../client-v2/src'),
        '@nocobase/shared': path.join(__dirname, '../shared/src'),
        '@nocobase/sdk': path.join(__dirname, '../sdk/src'),
        '@nocobase/flow-engine': path.join(__dirname, '../flow-engine/src'),
      },
    },
  },
  plugins: [
    pluginPreview({
      iframeOptions: {
        builderConfig: {
          resolve: {
            alias: {
              '@nocobase/client-v2': path.join(__dirname, '../client-v2/src'),
              '@nocobase/shared': path.join(__dirname, '../shared/src'),
              '@nocobase/sdk': path.join(__dirname, '../sdk/src'),
              '@nocobase/flow-engine': path.join(__dirname, '../flow-engine/src'),
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
