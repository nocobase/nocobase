/**
 * Rspress plugin: 为搜索结果生成「顶层目录 → 分组」的映射表。
 *
 * 分组标签必须跟着站点语言走，所以不能在代码里写死。这里在构建期扫描当前语言的文档目录，按三级取标签：
 *
 * 1. `_nav.json` 的导航项——它本来就是本地化好的（cn: 手册/开发/插件，ja: マニュアル/開発/プラグイン），
 *    顺序也直接当排序权重用。
 * 2. 各导航区自己的首页（`pageType: home`）里 features 指向的顶层目录，归到该导航区名下。
 *    这样 `/template-print`、`/workflow` 这类目录会落进「手册」，而不是各自成组。
 * 3. 前两级都没覆盖的目录，退回该目录 `index.md` 的标题单独成组。
 *
 * 三级都没有的目录不进表，运行时落到兜底分组，属安全降级。
 *
 * 结果通过虚拟模块 `virtual-search-sections` 暴露给运行时，见 `theme/search/searchHooks.ts`。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RspressPlugin } from '@rspress/core';
import {
  getTopLevelSegment,
  type SearchSection,
  type SearchSectionTable,
} from '../shared/searchSections';

export const SEARCH_SECTIONS_MODULE_ID = 'virtual-search-sections';

/** 第三级（目录自带标题）的 order 起点，保证导航区分组永远排在前面。 */
const STANDALONE_ORDER_BASE = 1000;

interface NavEntry {
  text?: string;
  link?: string;
}

function readJson<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return undefined;
  }
}

function readFile(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
}

/**
 * 从 markdown 里取 frontmatter 的 `title`，取不到再退回第一个 `# ` 标题。
 * 只需要一个标量字段，没必要为此引入 YAML 解析器（js-yaml 在本仓库只是传递依赖）。
 */
function readDocTitle(content: string): string {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (frontmatter) {
    const title = frontmatter[1].match(/^title:\s*(.+)$/m);
    if (title) {
      const value = title[1]
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .trim();
      if (value) {
        return value;
      }
    }
  }

  const heading = content.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : '';
}

function isHomePage(content: string): boolean {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return Boolean(frontmatter && /^pageType:\s*home\s*$/m.test(frontmatter[1]));
}

/** 取首页 features 里所有内部链接指向的顶层目录。 */
function collectFeatureSegments(content: string): string[] {
  const segments: string[] = [];
  for (const match of content.matchAll(/^\s*link:\s*(\S+)\s*$/gm)) {
    const link = match[1].replace(/^['"]|['"]$/g, '').split('#')[0];
    if (!link.startsWith('/')) {
      continue;
    }
    const segment = getTopLevelSegment(link);
    if (segment) {
      segments.push(segment);
    }
  }
  return segments;
}

function listTopLevelDirs(docsRoot: string): string[] {
  if (!fs.existsSync(docsRoot)) {
    return [];
  }

  return fs
    .readdirSync(docsRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        !entry.name.startsWith('_') &&
        entry.name !== 'public' &&
        entry.name !== 'node_modules',
    )
    .map((entry) => entry.name)
    .sort();
}

export function buildSearchSections(docsRoot: string): SearchSectionTable {
  const sections: SearchSection[] = [];
  const claimed = new Set<string>();

  const claim = (prefix: string, label: string, order: number) => {
    if (!prefix || !label || claimed.has(prefix)) {
      return;
    }
    claimed.add(prefix);
    sections.push({ id: prefix, prefix, label, order });
  };

  // 1. nav 顺序即分组顺序。`/plugins` 也照常入表——它的标签（「插件」）要从 nav 取，
  //    但运行时 resolveSection() 会把它的 order 覆盖成 PLUGIN_ORDER 沉到最后。
  const nav = readJson<NavEntry[]>(path.join(docsRoot, '_nav.json')) ?? [];
  const navSections = nav
    .filter(
      (item): item is Required<NavEntry> =>
        Boolean(item.text) && Boolean(item.link?.startsWith('/')),
    )
    .map((item, index) => ({
      label: item.text,
      prefix: getTopLevelSegment(item.link),
      order: index,
    }));

  for (const section of navSections) {
    claim(section.prefix, section.label, section.order);
  }

  // 2. 各导航区首页 features 指向的目录，归到该导航区名下。
  for (const section of navSections) {
    const content = readFile(
      path.join(docsRoot, section.prefix.slice(1), 'index.md'),
    );
    if (!content || !isHomePage(content)) {
      continue;
    }
    for (const segment of collectFeatureSegments(content)) {
      claim(segment, section.label, section.order);
    }
  }

  // 3. 剩下的目录用自己 index.md 的标题单独成组。
  let order = STANDALONE_ORDER_BASE;
  for (const dir of listTopLevelDirs(docsRoot)) {
    const prefix = `/${dir}`;
    if (claimed.has(prefix)) {
      continue;
    }

    const label = readDocTitle(readFile(path.join(docsRoot, dir, 'index.md')));
    if (label) {
      claim(prefix, label, order++);
    }
  }

  return sections;
}

export function pluginSearchSections(): RspressPlugin {
  return {
    name: 'plugin-search-sections',

    addRuntimeModules(config) {
      const docsRoot = config.root || path.join(process.cwd(), 'docs');
      const sections = buildSearchSections(docsRoot);

      return {
        [SEARCH_SECTIONS_MODULE_ID]: `export const searchSections = ${JSON.stringify(sections)};`,
      };
    },
  };
}
