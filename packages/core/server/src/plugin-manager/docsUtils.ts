import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
import matter from 'gray-matter';
import { PluginData, PluginResponse } from './types';
import { PLUGIN_STATICS_PATH, getExposeReadmeUrl } from './clientStaticUtils';
import { PluginManager } from './plugin-manager';

export const DOCS_PREFIX = '/docs';
export const DOCS_README = '/docs/README.md';
export const DOCS_SIDE_BAR = '/docs/_sidebar.md';
export const DOCS_SPECIAL_FILES = [DOCS_README, DOCS_SIDE_BAR];
export const docsI18n = {
  'zh-CN': {
    page: '页面',
    Overview: '总览',
    Plugins: '插件',
    'UI config': 'UI 配置',
    'menu type': '菜单',
    'page template': '页面模板',
    block: '区块',
    'data block': '数据区块',
    'relation block': '关系区块',
    'filter block': '选择区块',
    'action type': '操作',
    collection: '数据表模板',
    interface: '数据表字段类型',
    'interface basic': '基础数据字段',
    'interface choices': '选项数据字段',
    'interface media': '媒体数据字段',
    'interface Date & Time': '日期时间数据字段',
    'interface relation': '关系数据字段',
    'interface system': '系统数据字段',
    'interface advanced': '高级数据字段',
    'user auth': '用户认证',
    chart: '图表',
    'file storage': '文件存储',
    map: '地图',
    verification: '验证码',
    'workflow trigger': '工作流触发器',
    'workflow node': '工作流节点',
    'workflow flow control': '工作流流程控制',
    'workflow table operation': '工作流数据表操作',
    'workflow manual processing': '工作流人工处理',
    'workflow extension type': '工作流扩展类型',
  },
};

/**
 * JS 实现将数组转换为 markdown 目录格式
 *
 * @example
 * const arr = [{ path: '/aa', title: 'aa' }, { path: '/bb', title: 'bb', children: [{ path: '/cc', title: 'cc' }] }]
 * arrToMarkdown(arr) =>
 * `
 * * [aa](/aa)
 * * [bb](/bb)
 *  * [cc](/cc)
 * `
 */
interface DocMenu {
  title: string;
  path?: string;
  tags?: string[];
  children?: DocMenu[];
}
export function arrToMarkdown(arr: DocMenu[], depth = 0) {
  let result = '';
  for (const item of arr) {
    const indent = '  '.repeat(depth); // 根据深度计算缩进
    result += item.path ? `${indent}* [${item.title}](${item.path})\n` : `${indent}* ${item.title}\n`;
    if (item.children && item.children.length > 0) {
      result += arrToMarkdown(item.children, depth + 1); // 递归处理子项
    }
  }
  return result;
}

/**
 * get file name from file path
 *
 * @example
 * getFileName('/a/b/c.md') => c
 */
export function getFileName(filePath: string) {
  const parsed = path.parse(filePath);
  return parsed.name;
}

// get markdown title from file path
export function getMarkdownTitleFromFilePath(markdown: string, filePath: string) {
  return getMarkdownTitle(markdown) || getFileName(filePath);
}

// get markdown title from markdown content
export function getMarkdownTitle(markdown: string) {
  const title = markdown.match(/#\s+(.*)/)?.[1];
  return title?.trim();
}

// get package docs with lang
interface PackageDocsPath {
  README: string | null;
  CHANGELOG: string | null;
  docs: string[];
}
interface PackageDocsWithLangReturn {
  packageName: string;
  packageDir: string;
  docsPath: PackageDocsPath;
}
export function getPackageDocsWithLang(
  packageName: string,
  currentLang: string,
  defaultLang: string,
): PackageDocsWithLangReturn {
  const packageDir = path.dirname(require.resolve(packageName + '/package.json'));
  const globOptions = { cwd: packageDir, absolute: false, onlyFiles: true, caseSensitiveMatch: false };
  const readmes = glob.sync(['README*.md'], globOptions);
  const changeLogs = glob.sync(['CHANGELOG*.md'], globOptions);

  let docs = [];
  let docsGlobPath = 'docs/**/*.md';
  if (fs.existsSync(path.join(packageDir, 'docs', currentLang))) {
    docsGlobPath = `docs/${currentLang}/**/*.md`;
  } else if (fs.existsSync(path.join(packageDir, 'docs', defaultLang))) {
    docsGlobPath = `docs/${defaultLang}/**/*.md`;
  }
  docs = glob.sync(docsGlobPath, globOptions);

  let README = null;
  let CHANGELOG = null;
  if (readmes.includes(`README.${currentLang}.md`)) {
    README = `README.${currentLang}.md`;
  } else if (readmes.includes(`README.${defaultLang}.md`)) {
    README = `README.${defaultLang}.md`;
  } else if (readmes.includes(`README.md`)) {
    README = `README.md`;
  }

  if (changeLogs.includes(`CHANGELOG.${currentLang}.md`)) {
    CHANGELOG = `CHANGELOG.${currentLang}.md`;
  } else if (changeLogs.includes(`CHANGELOG.${defaultLang}.md`)) {
    CHANGELOG = `CHANGELOG.${defaultLang}.md`;
  } else if (changeLogs.includes(`CHANGELOG.md`)) {
    CHANGELOG = `CHANGELOG.md`;
  }

  return {
    packageName,
    packageDir,
    docsPath: {
      README,
      CHANGELOG,
      docs,
    },
  };
}

/**
 * build docs menu tree
 *
 * @example
 * buildDocsMenuTree([
 *  'docs/a/README.md',
 *  'docs/a/a1.md',
 *  'docs/a/a2.md',
 *  'docs/b/b1.md',
 *  'docs/c.md',
 *  'docs/d/d1/d11.md'
 * ]) =>
 * [
 *   {
 *     "title": "docs",
 *     "children": [
 *       {
 *         "title": "a",
 *         "children": [
 *           {
 *             "title": "index",
 *             "path": "docs/a/index.md"
 *           },
 *           {
 *             "title": "a1",
 *             "path": "docs/a/a1.md"
 *           },
 *           {
 *             "title": "a2",
 *             "path": "docs/a/a2.md"
 *           }
 *         ]
 *       },
 *       {
 *         "title": "b",
 *         "children": [
 *           {
 *             "title": "b1",
 *             "path": "docs/b/b1.md"
 *           }
 *         ]
 *       },
 *       {
 *         "title": "c",
 *         "path": "docs/c.md"
 *       },
 *       {
 *         "title": "d",
 *         "children": [
 *           {
 *             "title": "d1",
 *             "children": [
 *               {
 *                 "title": "d11",
 *                 "path": "docs/d/d1/d11.md"
 *               }
 *             ]
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * ]
 */
export function buildDocsMenuTree(arr: string[], packageDir: string) {
  const result: DocMenu[] = [];
  // 遍历每个路径
  for (const filePath of arr) {
    const parts = filePath.replace('docs/', '').replace('zh-CN', '').split('/').filter(Boolean); // 分割路径并去除空部分

    let currentNode: DocMenu[] = result; // 当前节点从根节点开始

    // 遍历路径的每个部分
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;

      if (isLastPart) {
        // 如果是路径的最后一个部分，则创建叶子节点
        const markdown = fs.readFileSync(path.join(packageDir, filePath), 'utf-8');
        const title = getMarkdownTitleFromFilePath(markdown, filePath);
        const tags = matter(markdown).data?.tags || [];
        currentNode.push({
          title,
          path: filePath,
          tags: Array.isArray(tags) ? tags : [tags],
        });
      } else {
        // 如果不是最后一个部分，则查找或创建目录节点
        const existingNode = currentNode.find((node) => node.title === part);
        if (existingNode) {
          currentNode = existingNode.children; // 找到现有节点并进入下一级
        } else {
          const newNode = { title: part, children: [] };
          currentNode.push(newNode);
          currentNode = newNode.children; // 创建新节点并进入下一级
        }
      }
    }
  }

  return result;
}

/**
 * get plugin menu
 * @example
 * getPluginMenu({
 *  packageName: '@nocobase/plugin-client',
 *  packageDir: '/Users/xxx/nocobase/packages/plugin-client',
 *  docsPath: {
 *    README: 'README.md',
 *    CHANGELOG: 'CHANGELOG.md',
 *    docs: ['docs/a/b/c.md', 'docs/a/b/d.md']
 *  }
 * }) =>
 * [
 *  {
 *    "title": "README",
 *    "path": "@nocobase/plugin-client/README.md"
 *  },
 *  {
 *    "title": "a",
 *    "children": [
 *      {
 *        "title": "b",
 *        "children": [
 *          {
 *            "title": "C title",
 *            "path": "@nocobase/plugin-client/docs/a/b/c.md"
 *          },
 *        {
 *            "title": "D title",
 *            "path": "@nocobase/plugin-client/docs/a/b/d.md"
 *        }
 *      ]
 *   },
 * {
 *    "title": "CHANGELOG",
 *    "path": "@nocobase/plugin-client/CHANGELOG.md"
 * }
 * ]
 */
export function getPluginMenu(packageName: string, currentLang: string, defaultLang: string, locale: object) {
  const packageDocs = getPackageDocsWithLang(packageName, currentLang, defaultLang);
  const menu: DocMenu[] = [];
  const { docsPath, packageDir } = packageDocs;
  if (docsPath.README) {
    menu.push({
      title: 'README',
      path: docsPath.README,
    });
  }

  if (docsPath.docs.length > 0) {
    menu.push(...buildDocsMenuTree(docsPath.docs, packageDir));
  }

  if (docsPath.CHANGELOG) {
    menu.push({
      title: 'CHANGELOG',
      path: docsPath.CHANGELOG,
    });
  }

  menu.forEach((item) => transformMenuPathAndTitle(item, packageName, currentLang, locale));
  const res: DocMenu[] = [
    {
      title: packageName,
      children: menu,
    },
  ];
  return res;
}

export const transformMenuPathAndTitle = (item: DocMenu, packageName: string, lang: string, locale: object) => {
  // 处理 path
  // 加上语言和npm包前缀
  if (item.path) {
    item.path = `${PLUGIN_STATICS_PATH}${packageName}/${item.path}`;
  }

  if (item.children) {
    item.children.forEach((child) => transformMenuPathAndTitle(child, packageName, lang, locale));

    // 处理 title
    const dirReadmeIndex = item.children.findIndex(
      (child) => child.path?.endsWith('index.md') || child.path?.endsWith('README.md'),
    );
    if (dirReadmeIndex > -1) {
      // 如果目录下有 index.md || README.md 则从 children 里面提取出来
      item.title = item.children[dirReadmeIndex].title;
      item.path = item.children[dirReadmeIndex].path;
      item.children.splice(dirReadmeIndex, 1);
      if (item.children.length === 0) {
        item.children = null;
      }
    } else {
      // TODO: 如果没有 index.md || README.md 则翻译成多语言
      // item.title =
    }
  }
};

export function getFlatMenuList(menu: DocMenu[]) {
  return menu.reduce((acc, cur) => {
    acc.push(cur);
    if (cur.children) {
      acc.push(...getFlatMenuList(cur.children));
    }
    return acc;
  }, []);
}

function getTagsMenu(menuData: DocMenu[], lang: string) {
  const menuList = getFlatMenuList(menuData);
  const tagMenuMap = menuList.reduce<Record<string, DocMenu[]>>((acc, menu) => {
    if (Array.isArray(menu.tags) && menu.tags.length > 0) {
      menu.tags.forEach((tag) => {
        const tagI18n = docsI18n[lang]?.[tag] || tag;
        if (!acc[tagI18n]) {
          acc[tagI18n] = [];
        }
        acc[tagI18n].push({
          ...menu,
          children: null,
        });
      });
    }
    return acc;
  }, {});
  const tagsMenu = Object.keys(tagMenuMap).reduce<DocMenu[]>((acc, tag) => {
    const tagMenu = tagMenuMap[tag];
    acc.push({ title: tag, children: tagMenu });
    return acc;
  }, []);
  return tagsMenu;
}

// 根据 menu 中的 tags，生成聚合目录信息
function getTagsSidebar(menuData: DocMenu[], lang: string) {
  const tagsMenu = getTagsMenu(menuData, lang);
  return arrToMarkdown(tagsMenu);
}

// 根据 menu，生成插件自己的 sidebar
function getPluginsSidebar(menuData: DocMenu[], currentLang: string) {
  return arrToMarkdown([
    {
      title: docsI18n[currentLang]?.Plugins || 'Plugins',
      children: menuData.flat(),
    },
  ]);
}

function getMenuData(plugins: PluginResponse[], currentLang: string, defaultLang = 'en-US', locale: object = {}) {
  const packages = plugins.map((plugin) => plugin.packageName || plugin.packageJson.name);
  const menuData = packages.map((packageName) => getPluginMenu(packageName, currentLang, defaultLang, locale));
  return menuData.flat();
}

/**
 * get doc sidebar
 */
export const getDocSidebar = (plugins: PluginResponse[], currentLang: string, defaultLang = 'en-US'): string => {
  const menuData = getMenuData(plugins, currentLang, defaultLang);
  const tagsSidebar = getTagsSidebar(menuData, currentLang);
  const pluginsSidebar = getPluginsSidebar(menuData, currentLang);
  const Overview = docsI18n[currentLang]?.Overview || 'Overview';
  return `* [${Overview}](/)\n${tagsSidebar}\n${pluginsSidebar}`;
};

function getPluginList(plugins: PluginResponse[], lang: string) {
  return plugins
    .map((item) =>
      item.description
        ? `* [${item.displayName || item.name}](${item.readmeUrl})- ${item.packageName} - ${item.description}`
        : `* [${item.displayName || item.name}](${item.readmeUrl})- ${item.packageName}`,
    )
    .join('\n');
}

/**
 * get plugin docs README.md
 */
export const getDocReadme = (plugins: PluginResponse[], currentLang: string, defaultLang = 'en-US') => {
  const menuData = getMenuData(plugins, currentLang, defaultLang);
  const tagsMenu = getTagsMenu(menuData, currentLang);

  const tags = tagsMenu
    .map((item) => {
      return `* [${item.title}](${item.children[0].path})`;
    })
    .join('\n');
  const pluginList = getPluginList(plugins, currentLang);
  const Overview = docsI18n[currentLang]?.Overview || 'Overview';
  return `# ${Overview}\n\n${tags.length ? '## Tags\n\n' + tags : ''}\n\n## Plugins\n\n${pluginList}`;
};
