import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';
// import { pluginPreview } from '@rspress/plugin-preview';
import { pluginSitemap } from '@rspress/plugin-sitemap';
import * as path from 'node:path';

const lang = process.env.DOCS_LANG || 'en';
const base = process.env.DOCS_BASE || lang === 'en' ? '/' : `/${lang}/`;
const checkDeadLinks = process.env.CHECK_DEAD_LINKS !== 'false';

const locales = {
  en: {
    title: 'NocoBase Documentation',
    description: 'Learn and master NocoBase quickly',
  },
  cn: {
    title: 'NocoBase 文档',
    description: '快速学习和掌握 NocoBase',
  },
}

const currentLocale = locales[lang as keyof typeof locales] || locales.en;

export default defineConfig({
  root: path.join(__dirname, `docs/${lang}`),
  outDir: path.join(__dirname, lang === 'en' ? 'dist' : `dist/${lang}`),
  themeDir: path.join(__dirname, 'theme'),
  base,
  title: currentLocale.title,
  description: currentLocale.description,
  icon: 'https://www.nocobase.com/images/favicon/apple-touch-icon.png',
  logo: {
    light: 'https://static-docs.nocobase.com/20260119193433.png',
    dark: 'https://static-docs.nocobase.com/20260119193447.png',
  },
  route: {
    cleanUrls: true,
  },
  builderConfig: {
    plugins: [pluginSass()],
    resolve: {
      alias: {
        '@nocobase/client-v2': path.join(__dirname, '../packages/core/client-v2/src'),
        '@nocobase/shared': path.join(__dirname, '../packages/core/shared/src'),
        '@nocobase/sdk': path.join(__dirname, '../packages/core/sdk/src'),
        '@nocobase/flow-engine': path.join(__dirname, '../packages/core/flow-engine/src'),
      },
    },
  },
  markdown: {
    link: {
      checkDeadLinks,
    },
  },
  plugins: [
    // pluginPreview({
    //   iframeOptions: {
    //     builderConfig: {
    //       resolve: {
    //         alias: {
    //           '@nocobase/client-v2': path.join(__dirname, '../client-v2/src'),
    //           '@nocobase/shared': path.join(__dirname, '../shared/src'),
    //           '@nocobase/sdk': path.join(__dirname, '../sdk/src'),
    //           '@nocobase/flow-engine': path.join(__dirname, '../flow-engine/src'),
    //         },
    //       },
    //     },
    //   },
    // }),
    pluginLlms(),
    pluginSitemap({
      siteUrl: `https://v2.docs.nocobase.com${lang === 'en' ? '' : `/${lang}`}`,
    }),
  ],
  lang,
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/nocobase/nocobase',
      }
    ],
  },
});
