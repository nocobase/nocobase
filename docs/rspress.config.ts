import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig, type RspressPlugin } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';
// import { pluginPreview } from '@rspress/plugin-preview';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

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

const indexLanguages = ['en', 'cn', 'ja', 'ko', 'es', 'pt', 'de', 'fr'];

const langMap = {
  en: 'en-US',
  cn: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  es: 'es-ES',
  pt: 'pt-PT',
  de: 'de-DE',
  fr: 'fr-FR',
};

function sitemap(): RspressPlugin {
  const routes = new Set<string>();

  return {
    name: '@nocobase/custom-sitemap',

    // Collect all route paths during build
    async extendPageData(pageData: any, isProd: boolean) {
      if (!isProd) {
        return;
      }
      if (lang !== 'en') {
        return;
      }
      if (pageData?.routePath) {
        routes.add(pageData.routePath as string);
      }
    },

    // Generate sitemap.xml after build
    async afterBuild(config: any, isProd: boolean) {
      if (!isProd) {
        return;
      }

      if (lang !== 'en') {
        return;
      }

      const baseDomain = 'https://v2.docs.nocobase.com';

      const urlEntries = Array.from(routes)
        .sort()
        .map((routePath) => {
          const links: string[] = [];

          // <loc> uses the canonical English URL
          const loc = `${baseDomain}${routePath}`;

          // Alternate links for each language (same logic as head canonical/alternate)
          for (const language of indexLanguages) {
            if (language === 'en') {
              links.push(
                `    <xhtml:link rel="alternate" hreflang="en-US" href="${baseDomain}${routePath}" />`,
              );
            } else {
              const hreflang = langMap[language as keyof typeof langMap];
              links.push(
                `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${baseDomain}/${language}${routePath}" />`,
              );
            }
          }

          // x-default points to the English URL
          links.push(
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseDomain}${routePath}" />`,
          );

          return [
            '  <url>',
            `    <loc>${loc}</loc>`,
            ...links,
            '  </url>',
          ].join('\n');
        })
        .join('\n');

      const sitemapXml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        urlEntries,
        '</urlset>',
        '',
      ].join('\n');

      const outDir: string = config.outDir;
      const sitemapPath = path.join(outDir, 'sitemap.xml');

      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(sitemapPath, sitemapXml, 'utf-8');
    },
  };
}
export default defineConfig({
  head: [
    ['meta', { name: 'robots', content: indexLanguages.includes(lang) ? 'index,follow' : 'noindex,nofollow' }],
    (route) => {
      if (lang !== 'en') {
        return `<link rel="canonical" href="https://v2.docs.nocobase.com/${lang}${route.routePath}" />`
      }
      return `<link rel="canonical" href="https://v2.docs.nocobase.com${route.routePath}" />`
    },
    (route) => {
      const links = [];
      links.push(...indexLanguages.map(language => {
        if (language === 'en') {
          return `<link rel="alternate" hreflang="en-US" href="https://v2.docs.nocobase.com${route.routePath}" />`;
        }
        const hreflang = langMap[language as keyof typeof langMap];
        return `<link rel="alternate" hreflang="${hreflang}" href="https://v2.docs.nocobase.com/${language}${route.routePath}" />`
      }));
      links.push(`<link rel="alternate" hreflang="x-default" href="https://v2.docs.nocobase.com${route.routePath}" />`);
      return links.join('\n');
    },
  ],
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
    sitemap(),
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
