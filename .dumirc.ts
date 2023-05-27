import { defineConfig } from 'dumi';
import { nav, sidebar } from './docs/config';

const lang = process.env.DOC_LANG || 'en-US';

console.log('process.env.DOC_LANG', process.env.DOC_LANG);

// 设置多语言的 title
function setTitle(menuChildren) {
  if (!menuChildren) return;
  menuChildren.forEach((item) => {
    if (typeof item === 'object') {
      item.title = item[`title.${lang}`] || item.title;
      if (item.children) {
        setTitle(item.children);
      }
    }
  });
}
if (lang !== 'en-US') {
  Object.values(sidebar).forEach(setTitle);
}

export default defineConfig({
  hash: true,
  outputPath: `./docs/dist/${lang}`,
  resolve: {
    docDirs: [`./docs/${lang}`]
  },
  locales: [
    { id: 'zh-CN', name: '中文' },
    { id: 'en-US', name: 'English' },
  ],
  themeConfig: {
    title: 'NocoBase',
    logo: 'https://www.nocobase.com/images/logo.png',
    nav: nav.map((item) => ({ ...item, title: (item[`title.${lang}`] || item.title) })),
    sidebarEnhance: sidebar,
    github: 'https://github.com/nocobase/nocobase',
    footer: 'nocobase | Copyright © 2022',
    localesEnhance: [
      { id: 'zh-CN', switchPrefix: '中' },
      { id: 'en-US', switchPrefix: 'en' }
    ],
  },
  scripts: [`
    function changeLanguage(language) {
      const ele = document.querySelector('.btn-inner');
      if (ele) {
        ele.parentElement.addEventListener('click', function (e) {
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.preventDefault();
          if (window.location.host.indexOf('localhost') > -1) {
            alert('本地开发，请使用 yarn doc --lang=xxx 切换')
            return;
          }
          if (window.location.host.indexOf('docs-cn') > -1) {
            // 跳转到英文网站
            window.location.href = window.location.href.replace('docs-cn', 'docs');
          } else {
            // 跳转到中文网站
            window.location.href = window.location.href.replace('docs', 'docs-cn');
          }
        })
      } else {
        setTimeout(() => {
          changeLanguage();
        }, 1000);
      }
    }

    changeLanguage()
  `]
});
