/**
 * Rspress plugin: 清洗搜索索引——去掉读不通的 Markdown 残留，并剔除内容完全重复的页面。
 *
 * 一、正文清洗
 *
 * 搜索结果卡片直接从索引的 `content` 里截一段展示，而 rspress 建索引时保留了 Markdown 源码
 * （`extractPageData` 只删了代码块和图片）。实测两类残留会让结果卡片读不通：
 *
 * - 表格行：`| \`uid\` | \`string\` | 否 | 模板打印按钮的 schema uid… |`——管道符和对齐空格混在一起，
 *   截断后读者拼不出语义。占实测 statement 的 20%。
 * - 空链接：`- [模板打印]()`——rspress 的 `remarkStripLinkUrls` 把 URL 清空后留下的 `[]()` 空壳。占 10%。
 *
 * `**加粗**` 和 `- ` 列表符不在清洗范围内：它们读起来通顺，还保留了强调和列表语义。
 *
 * 注意 `toc[].charIndex` 是 `content.indexOf('# 标题')` 算出来的，正文一旦改动长度就必须重算，
 * 否则正文命中会被算到错误的小标题下面。
 *
 * 二、重复页面
 *
 * 站点里有 34 组正文完全相同、路由不同的页面（如 `/data-sources/external/nocobase` 与
 * `/data-sources/data-source-external-nocobase/`，两个源文件逐字节相同）。它们在搜索结果里会渲染成
 * 标题、面包屑、摘要全都一样的两条，用户无从选择。这里按正文哈希只保留一条。
 *
 * 注意不要和「不同页面碰巧有同名小标题」搞混：那种情况面包屑不同（`外部 NocoBase > 功能说明 > 模板打印`
 * 对 `应用和主要插件内置表 > 内置表参考 > 模板打印`），本来就能区分，不在处理范围内。
 */
import { createHash } from 'node:crypto';
import type { PageIndexInfo, RspressPlugin } from '@rspress/core';

/** 表格的分隔行：`|---|:--:|`。纯格式，没有信息量。 */
const TABLE_DELIMITER_ROW = /^\s*\|(?:\s*:?-+:?\s*\|)+\s*$/;

/** 表格数据行：`| a | b |`。 */
const TABLE_ROW = /^\s*\|(.*)\|\s*$/;

/** URL 被清空后剩下的链接空壳：`[模板打印]()` → `模板打印`。 */
const EMPTY_LINK = /\[([^\]]*)\]\(\)/g;

/** 单元格之间的连接符。用两个空格而非 ` | `，避免又把管道符引回来。 */
const CELL_SEPARATOR = '  ';

export function cleanSearchContent(content: string): string {
  const lines: string[] = [];

  for (const line of content.split('\n')) {
    if (TABLE_DELIMITER_ROW.test(line)) {
      continue;
    }

    const tableRow = line.match(TABLE_ROW);
    if (tableRow) {
      const cells = tableRow[1]
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean);
      if (cells.length === 0) {
        continue;
      }
      // 每行表格后补一个空行，让它成为独立段落。rspress 截取 statement 时以 `\n\n` 为界，
      // 这样一条结果就正好是一行表格，不会把相邻几行糊在一起。
      lines.push(cells.join(CELL_SEPARATOR), '');
      continue;
    }

    lines.push(line);
  }

  return lines
    .join('\n')
    .replace(EMPTY_LINK, '$1')
    .replace(/\n{3,}/g, '\n\n');
}

/** 正文改动后重算 toc 的 charIndex，规则与 rspress 的 `extractPageData` 保持一致。 */
function recalculateTocCharIndex(page: PageIndexInfo): void {
  for (const item of page.toc) {
    const headingPrefix = '#'.repeat(item.depth);
    const heading = `${headingPrefix} ${item.text}`;

    // 同名标题靠 id 尾部的 `-N` 区分，需要跳过前 N 次出现，取第 N+1 个。
    const duplicateSuffix = item.id.match(/-(\d+)$/);
    let position = -1;
    if (duplicateSuffix) {
      for (let i = 0; i < Number(duplicateSuffix[1]); i++) {
        position = page.content.indexOf(heading, position + 1);
        if (position === -1) {
          break;
        }
      }
    }

    item.charIndex = page.content.indexOf(heading, position + 1);
  }
}

/** 短正文（目录页、占位页）容易撞车，不参与重复判定。 */
const MIN_DEDUPE_CONTENT_LENGTH = 200;

/**
 * 一组正文相同的页面里，选哪个留下。
 *
 * 路径层级少的优先（`/workflow/approval` 胜过 `/ai-employees/workflow/nodes/employee/approval`），
 * 层级相同则按字典序，保证同一份内容每次构建都选中同一个路由，构建产物可复现。
 */
function pickCanonicalRoute(routes: string[]): string {
  return [...routes].sort((a, b) => {
    const depthDiff = a.split('/').length - b.split('/').length;
    return depthDiff !== 0 ? depthDiff : a.localeCompare(b);
  })[0];
}

/**
 * 把正文完全相同的重复页面从搜索里排除，返回被排除的页面数。
 *
 * 用 rspress 自带的 `pageType: 'home'` 排除机制（`createPageData` 会把这类页面整个划进 `noindex`
 * 分组丢掉），而不是自己删数组元素或清空字段：
 *
 * - 删元素会让 SSG 渲染这些路由时找不到页面数据，整个构建失败。
 * - 只清 `content` 挡不住标题和小标题命中——`toc` 还在，重复的面包屑照样会冒出来。
 * - 清 `toc` 又会破坏页面右侧大纲和 Overview 组件（`pageData.pages` 和搜索索引共用同一份数据）。
 *
 * 改 frontmatter 只影响搜索索引这一路：`pageData` 里对应字段虽然也会带上，但页面渲染走的是
 * 路由配置和 MDX 编译产物，不读这个标记，所以被排除的页面照常访问、大纲照常显示。
 */
function dropDuplicatePages(pages: PageIndexInfo[]): number {
  const routesByHash = new Map<string, string[]>();

  for (const page of pages) {
    if (!page.content || page.content.length < MIN_DEDUPE_CONTENT_LENGTH) {
      continue;
    }
    const hash = createHash('md5').update(page.content).digest('hex');
    const routes = routesByHash.get(hash);
    if (routes) {
      routes.push(page.routePath);
    } else {
      routesByHash.set(hash, [page.routePath]);
    }
  }

  const dropped = new Set<string>();
  for (const routes of routesByHash.values()) {
    if (routes.length < 2) {
      continue;
    }
    const canonical = pickCanonicalRoute(routes);
    for (const route of routes) {
      if (route !== canonical) {
        dropped.add(route);
      }
    }
  }

  for (const page of pages) {
    if (dropped.has(page.routePath)) {
      page.frontmatter = { ...page.frontmatter, pageType: 'home' };
    }
  }

  return dropped.size;
}

export function pluginSearchIndex(): RspressPlugin {
  return {
    name: 'plugin-search-index',

    modifySearchIndexData(pages) {
      for (const page of pages) {
        if (!page.content) {
          continue;
        }

        const cleaned = cleanSearchContent(page.content);
        if (cleaned === page.content) {
          continue;
        }

        page.content = cleaned;
        recalculateTocCharIndex(page);
      }

      const dropped = dropDuplicatePages(pages);
      if (dropped > 0) {
        console.log(
          `[plugin-search-index] Removed ${dropped} duplicate page(s) from search index`,
        );
      }
    },
  };
}
