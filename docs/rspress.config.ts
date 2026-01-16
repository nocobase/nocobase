import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginSitemap } from '@rspress/plugin-sitemap';
import * as fs from 'node:fs';
import * as path from 'node:path';

const base = process.env.DOCS_BASE || '/';
const checkDeadLinks = process.env.CHECK_DEAD_LINKS !== 'false';

// All supported locales configuration
// Languages from submodules will only be included if the submodule is initialized
const ALL_LOCALES: Record<string, { lang: string; label: string; title: string; description: string }> = {
  en: {
    lang: 'en',
    label: 'English',
    title: 'NocoBase Documentation',
    description: 'Helping you learn and master NocoBase quickly',
  },
  cn: {
    lang: 'cn',
    label: '简体中文',
    title: 'NocoBase 文档',
    description: '帮助你快速学习和掌握 NocoBase',
  },
  ja: {
    lang: 'ja',
    label: '日本語',
    title: 'NocoBase ドキュメント',
    description: 'NocoBase を素早く学び、習得するお手伝いをします',
  },
  ko: {
    lang: 'ko',
    label: '한국어',
    title: 'NocoBase 문서',
    description: 'NocoBase를 빠르게 배우고 익히도록 도와드립니다',
  },
  de: {
    lang: 'de',
    label: 'Deutsch',
    title: 'NocoBase Dokumentation',
    description: 'Hilft Ihnen, NocoBase schnell zu lernen und zu beherrschen',
  },
  fr: {
    lang: 'fr',
    label: 'Français',
    title: 'Documentation NocoBase',
    description: 'Vous aide à apprendre et maîtriser NocoBase rapidement',
  },
  es: {
    lang: 'es',
    label: 'Español',
    title: 'Documentación de NocoBase',
    description: 'Ayudándote a aprender y dominar NocoBase rápidamente',
  },
  pt: {
    lang: 'pt',
    label: 'Português',
    title: 'Documentação NocoBase',
    description: 'Ajudando você a aprender e dominar o NocoBase rapidamente',
  },
  ru: {
    lang: 'ru',
    label: 'Русский',
    title: 'Документация NocoBase',
    description: 'Помогаем быстро изучить и освоить NocoBase',
  },
  it: {
    lang: 'it',
    label: 'Italiano',
    title: 'Documentazione NocoBase',
    description: 'Aiutarti ad imparare e padroneggiare NocoBase rapidamente',
  },
  tr: {
    lang: 'tr',
    label: 'Türkçe',
    title: 'NocoBase Belgeleri',
    description: 'NocoBase\'i hızlı bir şekilde öğrenmenize ve ustalaşmanıza yardımcı olur',
  },
  uk: {
    lang: 'uk',
    label: 'Українська',
    title: 'Документація NocoBase',
    description: 'Допомагаємо швидко вивчити та опанувати NocoBase',
  },
  vi: {
    lang: 'vi',
    label: 'Tiếng Việt',
    title: 'Tài liệu NocoBase',
    description: 'Giúp bạn học và thành thạo NocoBase một cách nhanh chóng',
  },
  id: {
    lang: 'id',
    label: 'Bahasa Indonesia',
    title: 'Dokumentasi NocoBase',
    description: 'Membantu Anda belajar dan menguasai NocoBase dengan cepat',
  },
  th: {
    lang: 'th',
    label: 'ไทย',
    title: 'เอกสาร NocoBase',
    description: 'ช่วยให้คุณเรียนรู้และเชี่ยวชาญ NocoBase อย่างรวดเร็ว',
  },
  pl: {
    lang: 'pl',
    label: 'Polski',
    title: 'Dokumentacja NocoBase',
    description: 'Pomaga szybko nauczyć się i opanować NocoBase',
  },
  nl: {
    lang: 'nl',
    label: 'Nederlands',
    title: 'NocoBase Documentatie',
    description: 'Helpt u NocoBase snel te leren en beheersen',
  },
  cs: {
    lang: 'cs',
    label: 'Čeština',
    title: 'Dokumentace NocoBase',
    description: 'Pomáhá vám rychle se naučit a zvládnout NocoBase',
  },
  ar: {
    lang: 'ar',
    label: 'العربية',
    title: 'وثائق NocoBase',
    description: 'مساعدتك على تعلم وإتقان NocoBase بسرعة',
  },
  he: {
    lang: 'he',
    label: 'עברית',
    title: 'תיעוד NocoBase',
    description: 'עוזר לך ללמוד ולשלוט ב-NocoBase במהירות',
  },
  hi: {
    lang: 'hi',
    label: 'हिन्दी',
    title: 'NocoBase दस्तावेज़ीकरण',
    description: 'आपको NocoBase को तेजी से सीखने और महारत हासिल करने में मदद करना',
  },
  sv: {
    lang: 'sv',
    label: 'Svenska',
    title: 'NocoBase Dokumentation',
    description: 'Hjälper dig att snabbt lära dig och bemästra NocoBase',
  },
};

// Detect available locales by checking if directory exists and has content
// This allows submodule-based languages to be excluded when not initialized
function getAvailableLocales() {
  const docsDir = path.join(__dirname, 'docs');
  const availableLangs: string[] = [];

  for (const lang of Object.keys(ALL_LOCALES)) {
    const langDir = path.join(docsDir, lang);
    try {
      if (fs.existsSync(langDir) && fs.statSync(langDir).isDirectory()) {
        const files = fs.readdirSync(langDir);
        // Check if directory has content (not empty, has more than just .git)
        const hasContent = files.some((f) => f !== '.git' && f !== '.gitkeep');
        if (hasContent) {
          availableLangs.push(lang);
        }
      }
    } catch {
      // Directory doesn't exist or is not accessible
    }
  }

  console.log(`[rspress] Available locales: ${availableLangs.join(', ')}`);
  return availableLangs.map((lang) => ALL_LOCALES[lang]);
}

const locales = getAvailableLocales();

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  outDir: path.join(__dirname, 'dist'),
  themeDir: path.join(__dirname, 'theme'),
  base,
  icon: 'https://www.nocobase.com/images/favicon/apple-touch-icon.png',
  logo: {
    light: '/logo.png',
    dark: '/logo-white.png',
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
    pluginLlms(),
    pluginSitemap({
      siteUrl: 'https://docs.nocobase.com',
    }),
  ],
  locales,
  lang: 'en',
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
