import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
import matter from 'gray-matter';
import { PluginResponse } from './types';
import { PLUGIN_STATICS_PATH } from './clientStaticUtils';

export const DOCS_PREFIX = '/docs';
export const DOCS_README = '/docs/README.md';
export const DOCS_SIDE_BAR = '/docs/_sidebar.md';
export const DOCS_TAGS = '/tags/';
export const PLUGIN_INDEX = '_index.md';
export const DOCS_SPECIAL_FILES = [DOCS_README, DOCS_SIDE_BAR, DOCS_TAGS, PLUGIN_INDEX];

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
  tags?: { key: string; title?: string }[];
  sort?: number;
  children?: DocMenu[];
}
export function arrToMarkdown(arr: DocMenu[], depth = 0) {
  let result = '';
  arr.sort((a, b) => a.sort - b.sort);
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
export async function getPackageDocsWithLang(
  packageName: string,
  currentLang: string,
  defaultLang: string,
): Promise<PackageDocsWithLangReturn> {
  const packageDir = path.dirname(require.resolve(packageName + '/package.json'));
  const globOptions = { cwd: packageDir, absolute: false, onlyFiles: true, caseSensitiveMatch: false };
  const readmes = await glob(['README*.md'], globOptions);
  const changeLogs = await glob(['CHANGELOG*.md'], globOptions);

  let docs = [];
  let docsGlobPath = 'docs/**/*.md';
  if (fs.existsSync(path.join(packageDir, 'docs', currentLang))) {
    docsGlobPath = `docs/${currentLang}/**/*.md`;
  } else if (fs.existsSync(path.join(packageDir, 'docs', defaultLang))) {
    docsGlobPath = `docs/${defaultLang}/**/*.md`;
  }
  docs = await glob(docsGlobPath, globOptions);

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
export async function buildDocsMenuTree(arr: string[], packageDir: string): Promise<DocMenu[]> {
  const result: DocMenu[] = [];
  // 遍历每个路径
  for await (const filePath of arr) {
    const parts = filePath.replace('docs/', '').replace('zh-CN', '').split('/').filter(Boolean); // 分割路径并去除空部分

    let currentNode: DocMenu[] = result; // 当前节点从根节点开始

    // 遍历路径的每个部分
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLastPart = i === parts.length - 1;

      if (isLastPart) {
        // 如果是路径的最后一个部分，则创建叶子节点
        const markdown = await fs.promises.readFile(path.join(packageDir, filePath), 'utf-8');
        const title = getMarkdownTitleFromFilePath(markdown, filePath);
        const { tags = [], sort = 0 } = matter(markdown).data || {};
        currentNode.push({
          title,
          path: filePath,
          tags: (Array.isArray(tags) ? tags : [tags]).map((item) => (typeof item === 'string' ? { key: item } : item)),
          sort,
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
export async function getPluginMenu(plugin: PluginResponse, currentLang: string, defaultLang: string, locale: object) {
  const packageDocs = await getPackageDocsWithLang(plugin.packageName, currentLang, defaultLang);
  const menu: DocMenu[] = [];
  const { docsPath, packageDir } = packageDocs;

  if (docsPath.docs.length > 0) {
    menu.push(...(await buildDocsMenuTree(docsPath.docs, packageDir)));
  } else {
    if (docsPath.README) {
      menu.push({
        title: 'README',
        path: docsPath.README,
      });
    }
  }

  const hasSwaggerFile = await glob(['src/swagger.*', 'dist/swagger.*'], { onlyFiles: true, cwd: packageDir });
  const hasSwaggerDir = await glob(['src/swagger', 'dist/swagger'], { onlyDirectories: true, cwd: packageDir });
  if (hasSwaggerFile.length > 0 || hasSwaggerDir.length > 0) {
    menu.push({
      title: 'HTTP API',
      path: `swagger?ns=plugins/${plugin.name}`,
    });
  }

  if (docsPath.CHANGELOG) {
    menu.push({
      title: 'CHANGELOG',
      path: docsPath.CHANGELOG,
    });
  }

  menu.forEach((item) => transformMenuPathAndTitle(item, plugin.packageName, currentLang, locale));
  const res: DocMenu[] = [
    {
      title: plugin.displayName || plugin.name,
      path: `${PLUGIN_STATICS_PATH}${plugin.packageName}/_index.md`,
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
      Object.assign(item, item.children[dirReadmeIndex], { children: item.children });
      item.children.splice(dirReadmeIndex, 1);
      if (item.children.length === 0) {
        item.children = null;
      }
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

function getTagsMenu(menuData: DocMenu[]) {
  const menuList = getFlatMenuList(menuData);
  const tagMenuMap = menuList.reduce<Record<string, DocMenu>>((acc, menu: DocMenu) => {
    if (Array.isArray(menu.tags) && menu.tags.length > 0) {
      menu.tags.forEach((tag) => {
        if (!acc[tag.key]) {
          acc[tag.key] = {
            title: tag.key,
            path: encodeURI(`/tags/${tag.key}.md`),
            children: [],
          };
        }
        if (tag.title) {
          acc[tag.key].title = tag.title;
        }
        acc[tag.key].children.push({
          ...menu,
          path: menu.path + '?tag',
          children: null,
        });
      });
    }
    return acc;
  }, {});
  const tagsMenu = Object.values(tagMenuMap).flat();
  return tagsMenu;
}

function getTagsTitle(currentLang: string) {
  return currentLang === 'zh-CN' ? '标签' : 'Tags';
}

function getPluginsTitle(currentLang: string) {
  return currentLang === 'zh-CN' ? '插件' : 'Plugins';
}

function getOverviewTitle(currentLang: string) {
  return currentLang === 'zh-CN' ? '总览' : 'Overview';
}

// 根据 menu 中的 tags，生成聚合目录信息
function getTagsSidebar(menuData: DocMenu[], currentLang: string) {
  const tagsMenu = getTagsMenu(menuData);
  return arrToMarkdown([
    {
      title: getTagsTitle(currentLang),
      children: tagsMenu,
    },
  ]);
}

// 根据 menu，生成插件自己的 sidebar
function getPluginsSidebar(menuData: DocMenu[], currentLang: string) {
  return arrToMarkdown([
    {
      title: getPluginsTitle(currentLang),
      children: menuData.flat(),
    },
  ]);
}

async function getMenuData(plugins: PluginResponse[], currentLang: string, defaultLang = 'en-US', locale: object = {}) {
  const menuData = await Promise.all(plugins.map((plugin) => getPluginMenu(plugin, currentLang, defaultLang, locale)));
  return menuData.flat();
}

/**
 * get doc sidebar
 */
export const getDocSidebar = async (
  plugins: PluginResponse[],
  currentLang: string,
  defaultLang = 'en-US',
): Promise<string> => {
  const menuData = await getMenuData(plugins, currentLang, defaultLang);
  const tagsSidebar = getTagsSidebar(menuData, currentLang);
  const pluginsSidebar = getPluginsSidebar(menuData, currentLang);
  const overviewTitle = getOverviewTitle(currentLang);
  return `* [${overviewTitle}](/)\n* [HTTP API](${PLUGIN_STATICS_PATH}swagger)\n${tagsSidebar}\n${pluginsSidebar}`;
};

function getPluginList(plugins: PluginResponse[]) {
  return plugins
    .map((item) => {
      const title = item.displayName || item.name;
      const path = `${PLUGIN_STATICS_PATH}${item.packageName}/_index.md`;
      const description = item.description ? `- ${item.description}` : '';
      return `* [${title}](${path})- ${item.packageName} ${description}`;
    })
    .join('\n');
}

export const getOverview = async (plugins: PluginResponse[], currentLang: string, defaultLang = 'en-US') => {
  const menuData = await getMenuData(plugins, currentLang, defaultLang);
  const tagsMenu = getTagsMenu(menuData);

  const tags = tagsMenu
    .map((item) => {
      return `* [${item.title}](${item.path})`;
    })
    .join('\n');
  const pluginList = getPluginList(plugins);

  const overviewTitle = getOverviewTitle(currentLang);
  const pluginsTitle = getPluginsTitle(currentLang);
  const tagsTitle = getTagsTitle(currentLang);

  return `# ${overviewTitle}\n\n## ${tagsTitle}\n\n${tags}\n\n## ${pluginsTitle}\n\n${pluginList}`;
};

export const getTagContent = async (
  pathname: string,
  plugins: PluginResponse[],
  currentLang: string,
  defaultLang = 'en-US',
) => {
  const target = pathname.slice(pathname.indexOf(DOCS_TAGS));
  const menuData = await getMenuData(plugins, currentLang, defaultLang);
  const tagsMenu = getTagsMenu(menuData);
  const tagMenu = tagsMenu.find((item) => item.path === target);
  if (!tagMenu) {
    return '';
  }

  const content = arrToMarkdown(tagMenu.children);
  return `# ${tagMenu.title}\n\n${content}`;
};

export const getPluginIndexContent = async (
  pathname: string,
  plugins: PluginResponse[],
  currentLang: string,
  defaultLang = 'en-US',
) => {
  const menuData = await getMenuData(plugins, currentLang, defaultLang);
  const target = pathname.replace(DOCS_PREFIX, '');
  const pluginMenu = menuData.find((item) => item.path === target);
  if (!pluginMenu) {
    return '';
  }
  const content = arrToMarkdown(pluginMenu.children);
  return `# ${pluginMenu.title}\n\n${content}`;
};
