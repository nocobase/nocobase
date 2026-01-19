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
    {
      lang: 'ja',
      label: '日本語',
      title: 'NocoBase ドキュメント',
      description: 'NocoBase を素早く学び、習得するお手伝いをします',
    },
    {
      lang: 'ko',
      label: '한국어',
      title: 'NocoBase 문서',
      description: 'NocoBase를 빠르게 배우고 익히도록 도와드립니다',
    },
    {
      lang: 'de',
      label: 'Deutsch',
      title: 'NocoBase Dokumentation',
      description: 'Hilft Ihnen, NocoBase schnell zu lernen und zu beherrschen',
    },
    {
      lang: 'fr',
      label: 'Français',
      title: 'Documentation NocoBase',
      description: 'Vous aide à apprendre et maîtriser NocoBase rapidement',
    },
    {
      lang: 'es',
      label: 'Español',
      title: 'Documentación de NocoBase',
      description: 'Ayudándote a aprender y dominar NocoBase rápidamente',
    },
    {
      lang: 'pt',
      label: 'Português',
      title: 'Documentação NocoBase',
      description: 'Ajudando você a aprender e dominar o NocoBase rapidamente',
    },
    {
      lang: 'ru',
      label: 'Русский',
      title: 'Документация NocoBase',
      description: 'Помогаем быстро изучить и освоить NocoBase',
    },
    {
      lang: 'it',
      label: 'Italiano',
      title: 'Documentazione NocoBase',
      description: 'Aiutarti ad imparare e padroneggiare NocoBase rapidamente',
    },
    {
      lang: 'tr',
      label: 'Türkçe',
      title: 'NocoBase Belgeleri',
      description: 'NocoBase\'i hızlı bir şekilde öğrenmenize ve ustalaşmanıza yardımcı olur',
    },
    {
      lang: 'uk',
      label: 'Українська',
      title: 'Документація NocoBase',
      description: 'Допомагаємо швидко вивчити та опанувати NocoBase',
    },
    {
      lang: 'vi',
      label: 'Tiếng Việt',
      title: 'Tài liệu NocoBase',
      description: 'Giúp bạn học và thành thạo NocoBase một cách nhanh chóng',
    },
    {
      lang: 'id',
      label: 'Bahasa Indonesia',
      title: 'Dokumentasi NocoBase',
      description: 'Membantu Anda belajar dan menguasai NocoBase dengan cepat',
    },
    {
      lang: 'th',
      label: 'ไทย',
      title: 'เอกสาร NocoBase',
      description: 'ช่วยให้คุณเรียนรู้และเชี่ยวชาญ NocoBase อย่างรวดเร็ว',
    },
    {
      lang: 'pl',
      label: 'Polski',
      title: 'Dokumentacja NocoBase',
      description: 'Pomaga szybko nauczyć się i opanować NocoBase',
    },
    {
      lang: 'nl',
      label: 'Nederlands',
      title: 'NocoBase Documentatie',
      description: 'Helpt u NocoBase snel te leren en beheersen',
    },
    {
      lang: 'cs',
      label: 'Čeština',
      title: 'Dokumentace NocoBase',
      description: 'Pomáhá vám rychle se naučit a zvládnout NocoBase',
    },
    {
      lang: 'ar',
      label: 'العربية',
      title: 'وثائق NocoBase',
      description: 'مساعدتك على تعلم وإتقان NocoBase بسرعة',
    },
    {
      lang: 'he',
      label: 'עברית',
      title: 'תיעוד NocoBase',
      description: 'עוזר לך ללמוד ולשלוט ב-NocoBase במהירות',
    },
    {
      lang: 'hi',
      label: 'हिन्दी',
      title: 'NocoBase दस्तावेज़ीकरण',
      description: 'आपको NocoBase को तेजी से सीखने और महारत हासिल करने में मदद करना',
    },
    {
      lang: 'sv',
      label: 'Svenska',
      title: 'NocoBase Dokumentation',
      description: 'Hjälper dig att snabbt lära dig och bemästra NocoBase',
    },
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
