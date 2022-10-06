import transformer from '@umijs/preset-dumi/lib/transformer';
import { defineConfig } from 'dumi';
import fs from 'fs';
import path from 'path';
import menus from './docs/menus';

const lang = process.env.DOC_LANG || 'en-US';

console.log('process.env.DOC_LANG', process.env.DOC_LANG);

const findFilePath = (filename, lang) => {
  const filePath = path.resolve(__dirname, `docs/${lang}/${filename}`);
  if (fs.existsSync(`${filePath}.md`)) {
    return `${filePath}.md`;
  }
  return;
};

const markdown = (filename, lang) => {
  const filePath = findFilePath(filename, lang);
  if (!filePath) {
    return;
  }
  return transformer.markdown(fs.readFileSync(filePath, 'utf8').toString(), filePath);
};

const getPath = (value: string) => {
  if (!value) {
    return '';
  }
  const keys = value.split('/');
  if (keys.pop() === 'index') {
    return keys.join('/') || '/';
  }
  return value;
};

const getTitle = (item, lang) => {
  if (lang) {
    return item[`title.${lang}`] || item.title;
  }
  return item.title;
};

const parseMenuItems = (items: any[], lang: string) => {
  const menuItems: any[] = [];
  for (const item of items) {
    if (typeof item === 'string') {
      const result = markdown(item, lang);
      if (result) {
        menuItems.push({
          title: result.meta.title,
          disabled: result.meta.disabled,
          path: getPath(item),
        });
      }
    } else if (item.children) {
      menuItems.push({
        ...item,
        title: getTitle(item, lang),
        children: parseMenuItems(item.children, lang),
      });
    } else if (item.path) {
      menuItems.push({
        ...item,
        title: getTitle(item, lang),
        path: getPath(item.path),
      });
    } else {
      menuItems.push({
        title: getTitle(item, lang),
        ...item,
      });
    }
  }
  return menuItems;
};

export default defineConfig({
  title: 'NocoBase',
  outputPath: `./docs/dist/${lang}`,
  mode: 'site',
  resolve: {
    includes: [`./docs/${lang}`],
  },
  locales: [[lang, lang]],
  hash: true,
  logo: 'https://www.nocobase.com/images/logo.png',
  navs: {
    'en-US': [
      {
        title: 'Introduction',
        path: '/introduction'
      },
      {
        title: 'Getting started',
        path: '/getting-started'
      },
      {
        title: 'Manual',
        path: '/manual'
      },
      {
        title: 'Development',
        path: '/development'
      },
      {
        title: 'API reference',
        path: '/api'
      },
      {
        title: 'GitHub',
        path: 'https://github.com/nocobase/nocobase',
      },
    ],
    'zh-CN': [
      {
        title: '介绍',
        path: '/introduction'
      },
      {
        title: '快速开始',
        path: '/getting-started'
      },
      {
        title: '使用手册',
        path: '/manual'
      },
      {
        title: '插件开发',
        path: '/development'
      },
      {
        title: 'API 参考',
        path: '/api'
      },
      {
        title: 'GitHub',
        path: 'https://github.com/nocobase/nocobase',
      },
    ]
  },
  menus: Object.keys(menus).reduce((result, key) => {
    const items = menus[key];
    result[key] = parseMenuItems(items, lang);
    return result;
  }, {})
});
