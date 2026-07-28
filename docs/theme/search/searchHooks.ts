/**
 * 自定义搜索钩子（数据层）。在 `rspress.config.ts` 里通过 `search.searchHooks` 注册。
 *
 * 只做四件事：给每条结果打上分组标记、按 link 去重、按「分组 → 匹配类型 → 原相关性」稳定排序、
 * 把 `/plugins/@nocobase/` 的插件元信息页沉到最后。分组标题的渲染在 `theme/components/Search/` 里。
 *
 * 为什么插件页要沉底：它们正文只有 frontmatter 和一行标题，和真正的文档同名（例如「模板打印」同时存在
 * `/template-print/` 和 `/plugins/@nocobase/plugin-action-template-print/`），却在索引里占了近两成，
 * 排在前面会把真正有内容的文档挤下去。
 */
import type { DefaultMatchResult, OnSearch } from '@rspress/core/theme';
import { searchSections } from 'virtual-search-sections';
import {
  PLUGIN_SECTION_ID,
  resolveSection,
  type SearchSection,
} from '../../shared/searchSections';

type DefaultMatchResultItem = DefaultMatchResult['result'][number];

/** 打上分组标记后的结果项。渲染层按 `section` 分组并显示标题。 */
export type SectionedMatchResultItem = DefaultMatchResultItem & {
  section: SearchSection;
};

/** 同一页面命中多次时的优先级：标题 > 小标题 > 正文。 */
const TYPE_RANK: Record<DefaultMatchResultItem['type'], number> = {
  title: 0,
  header: 1,
  content: 2,
};

/** 标题和查询词完全相同（「模板打印」→ 标题就是「模板打印」），最相关。 */
const EXACT_TITLE_RANK = -2;

/**
 * 标题以查询词开头（「单点登录」→「单点登录 SSO 集成」），次相关。
 *
 * 这一档必须存在：否则它和「查询词出现在标题中间」（「应用单点登录」）同档，
 * 只能靠标题长度决胜，而更短的「应用单点登录」会赢——但显然是讲单点登录本身的那篇更该排前面。
 */
const PREFIX_TITLE_RANK = -1;

/**
 * 分组的展示 key。同一个标签下的多个顶层目录（「手册」名下有 /template-print、/data-sources……）
 * 必须并成一个分组框，否则同名标题会重复出现好几次。
 */
export function getSectionKey(section: SearchSection): string {
  return `${section.order}|${section.label || section.id}`;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/** 结果的相关性档位，越小越靠前。 */
function rankOf(item: DefaultMatchResultItem, query: string): number {
  if (item.type !== 'title') {
    return TYPE_RANK[item.type];
  }

  const title = normalize(item.title);
  const keyword = normalize(query);

  if (title === keyword) {
    return EXACT_TITLE_RANK;
  }
  if (title.startsWith(keyword)) {
    return PREFIX_TITLE_RANK;
  }
  return TYPE_RANK.title;
}

/**
 * 同档位的两条标题命中之间的次级比较：标题越短越贴近查询词。
 *
 * 只在前面所有判据都打平时才用得上。例如英文站 `/template-print/`（Template Printing）和
 * `/template-print/http-api`（Template Print HTTP API）同为前缀命中，这时短的更「正题」。
 */
function compareTitleLength(
  a: DefaultMatchResultItem,
  b: DefaultMatchResultItem,
): number {
  if (a.type !== 'title' || b.type !== 'title') {
    return 0;
  }
  return a.title.length - b.title.length;
}

/** 取一条结果的分组标记；没打上标记（理论上不会）时返回 undefined，由渲染层回落到兜底分组。 */
export function getSectionOf(
  item: DefaultMatchResultItem | undefined,
): SearchSection | undefined {
  return item && 'section' in item
    ? (item as SectionedMatchResultItem).section
    : undefined;
}

/** 合并后的正文预览最多展示几个片段。再多卡片会长到喧宾夺主。 */
const MAX_MERGED_STATEMENTS = 3;

/** 合并正文片段时的分隔符。 */
const STATEMENT_SEPARATOR = ' … ';

function isContentMatch(
  item: DefaultMatchResultItem,
): item is Extract<DefaultMatchResultItem, { type: 'content' }> {
  return item.type === 'content';
}

/**
 * 把同一页面的多条正文命中合并成一条，片段之间用 `…` 连接。
 *
 * 高亮位置是相对 statement 的偏移量，拼接后必须整体右移各自片段在结果串里的起点，否则高亮会错位。
 */
function mergeContentMatches(
  matches: Extract<DefaultMatchResultItem, { type: 'content' }>[],
): DefaultMatchResultItem {
  const [first] = matches;
  if (matches.length === 1) {
    return first;
  }

  const kept = matches.slice(0, MAX_MERGED_STATEMENTS);
  const statements: string[] = [];
  const highlightInfoList: { start: number; length: number }[] = [];
  let offset = 0;

  for (const match of kept) {
    const statement = match.statement.trim();
    if (!statement) {
      continue;
    }
    if (statements.length > 0) {
      offset += STATEMENT_SEPARATOR.length;
    }
    for (const highlight of match.highlightInfoList) {
      // trim() 掉的前导空白也要从偏移里扣掉。
      const trimmedPrefix = match.statement.length - match.statement.trimStart().length;
      highlightInfoList.push({
        start: highlight.start - trimmedPrefix + offset,
        length: highlight.length,
      });
    }
    statements.push(statement);
    offset += statement.length;
  }

  return {
    ...first,
    statement: statements.join(STATEMENT_SEPARATOR),
    highlightInfoList,
  };
}

/** 去重 + 打标 + 排序。抽成纯函数，方便脱离 rspress 运行时验证。 */
export function organizeSearchResult(
  items: DefaultMatchResultItem[],
  query: string,
): SectionedMatchResultItem[] {
  // 同一页面的多条正文命中先合并成一条，多个片段进同一条预览。
  // 用不带锚点的路由做 key：正文片段的锚点是按所在小节推出来的，同一页不同段落锚点可能不同。
  const contentByPage = new Map<
    string,
    Extract<DefaultMatchResultItem, { type: 'content' }>[]
  >();
  for (const item of items) {
    if (!isContentMatch(item)) {
      continue;
    }
    const pageKey = item.link.split('#')[0];
    const group = contentByPage.get(pageKey);
    if (group) {
      group.push(item);
    } else {
      contentByPage.set(pageKey, [item]);
    }
  }

  const mergedContent = new Map<string, DefaultMatchResultItem>();
  for (const [pageKey, matches] of contentByPage) {
    mergedContent.set(pageKey, mergeContentMatches(matches));
  }

  const seenContentPage = new Set<string>();
  const deduped: DefaultMatchResultItem[] = [];
  for (const item of items) {
    if (!isContentMatch(item)) {
      deduped.push(item);
      continue;
    }
    const pageKey = item.link.split('#')[0];
    if (seenContentPage.has(pageKey)) {
      continue;
    }
    seenContentPage.add(pageKey);
    deduped.push(mergedContent.get(pageKey) ?? item);
  }

  const bestByLink = new Map<
    string,
    { item: DefaultMatchResultItem; index: number }
  >();

  deduped.forEach((item, index) => {
    const existing = bestByLink.get(item.link);
    if (!existing || TYPE_RANK[item.type] < TYPE_RANK[existing.item.type]) {
      // 命中同一个链接时保留更「标题级」的那条，但沿用首次出现的位置，避免把相关性靠前的结果推后。
      bestByLink.set(item.link, { item, index: existing?.index ?? index });
    }
  });

  const entries = [...bestByLink.values()].map(({ item, index }) => ({
    item: { ...item, section: resolveSection(item.link, searchSections) },
    rank: rankOf(item, query),
    index,
  }));

  // 分组之间按「组内最好的那条结果」排序：一个组里有标题精确命中，整组就该排在只有正文命中的组前面。
  const bestRankBySection = new Map<string, number>();
  for (const entry of entries) {
    const key = getSectionKey(entry.item.section);
    const best = bestRankBySection.get(key);
    if (best === undefined || entry.rank < best) {
      bestRankBySection.set(key, entry.rank);
    }
  }

  return entries
    .sort((a, b) => {
      const aSection = a.item.section;
      const bSection = b.item.section;

      // 插件分组无条件沉底。必须先于下面的相关性比较，否则插件页标题恰好和查询词相同时
      // （en 站 `/plugins/.../plugin-action-template-print` 标题就是 "Template print"）会被顶上来。
      const aIsPlugin = aSection.id === PLUGIN_SECTION_ID;
      const bIsPlugin = bSection.id === PLUGIN_SECTION_ID;
      if (aIsPlugin !== bIsPlugin) {
        return aIsPlugin ? 1 : -1;
      }

      if (aSection.order !== bSection.order) {
        // 组间按「组内最好的那条」排：有标题精确命中的组，排在只有正文命中的组前面。
        const aBest = bestRankBySection.get(getSectionKey(aSection)) ?? 0;
        const bBest = bestRankBySection.get(getSectionKey(bSection)) ?? 0;
        if (aBest !== bBest) {
          return aBest - bBest;
        }
        return aSection.order - bSection.order;
      }
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }
      const byTitleLength = compareTitleLength(a.item, b.item);
      if (byTitleLength !== 0) {
        return byTitleLength;
      }
      // 同组同档位时保持 FlexSearch 原本的相关性次序，不自造排序。
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

export const onSearch: OnSearch = (query, matchedResult) => {
  for (const group of matchedResult) {
    // 原地替换：rspress 把这个数组直接交给渲染层，返回新数组不会生效。
    group.result.splice(
      0,
      group.result.length,
      ...organizeSearchResult(group.result, query),
    );
  }
};
