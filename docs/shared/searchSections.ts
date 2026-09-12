/**
 * 搜索结果的分组归属。
 *
 * 分组表在构建期由 `plugins/pluginSearchSections.ts` 扫描 `_nav.json` 和各顶层目录的 `index.md` 生成，
 * 运行时由 `theme/search/searchHooks.ts` 消费。这里只放两边共用的类型和纯函数，不依赖 node 也不依赖 DOM。
 */

/** 插件元信息页的路由前缀。这类页面正文只有 frontmatter，搜索里始终排在最后。 */
export const PLUGIN_ROUTE_PREFIX = '/plugins/';

/** 插件分组的固定 id。渲染层用它决定是否加视觉分隔和插件徽标。 */
export const PLUGIN_SECTION_ID = 'plugins';

/** 兜底分组的固定 id，标签由渲染层通过 i18n key `searchSectionOthers` 取。 */
export const OTHERS_SECTION_ID = 'others';

/** 兜底分组的 order。比任何真实分组都大，但小于插件分组。 */
export const OTHERS_ORDER = 1_000_000;

/** 插件分组的 order。永远最后。 */
export const PLUGIN_ORDER = 2_000_000;

export interface SearchSection {
  /** 分组 id，取顶层目录名（如 `/template-print`）或 `plugins` / `others` 这两个固定值。 */
  id: string;
  /** 该分组覆盖的顶层路由前缀，如 `/template-print`。固定分组为空串。 */
  prefix: string;
  /** 展示用的本地化标签。固定分组为空串，由渲染层查 i18n。 */
  label: string;
  /** 排序权重，小的在前。 */
  order: number;
}

/** 构建期注入、运行时读取的分组表。 */
export type SearchSectionTable = SearchSection[];

export const PLUGIN_SECTION: SearchSection = {
  id: PLUGIN_SECTION_ID,
  prefix: PLUGIN_ROUTE_PREFIX,
  label: '',
  order: PLUGIN_ORDER,
};

export const OTHERS_SECTION: SearchSection = {
  id: OTHERS_SECTION_ID,
  prefix: '',
  label: '',
  order: OTHERS_ORDER,
};

/**
 * 取路由的顶层目录：`/template-print/advanced/x` → `/template-print`。
 * 语言前缀（`/cn/...`）不用处理：搜索索引里的 routePath 本来就不带语言前缀，每种语言是独立的站点构建。
 */
export function getTopLevelSegment(routePath: string): string {
  const [segment] = routePath.replace(/^\/+/, '').split('/');
  return segment ? `/${segment}` : '';
}

/** 是否是 `/plugins` 或其下的插件元信息页。 */
export function isPluginRoute(routePath: string): boolean {
  return (
    routePath === PLUGIN_ROUTE_PREFIX.replace(/\/$/, '') ||
    routePath.startsWith(PLUGIN_ROUTE_PREFIX)
  );
}

/**
 * 把一条路由映射到分组。三级回退：插件页 → 分组表里的顶层目录 → 兜底分组。
 *
 * 插件页复用分组表里 `/plugins` 那条的标签（它来自 `_nav.json`，已经本地化好了），
 * 但 order 强制改成 `PLUGIN_ORDER`，保证不管 nav 里排第几都沉到最后。
 */
export function resolveSection(
  routePath: string,
  table: SearchSectionTable,
): SearchSection {
  const topLevel = getTopLevelSegment(routePath);
  if (!topLevel) {
    return OTHERS_SECTION;
  }

  const matched = table.find((section) => section.prefix === topLevel);

  if (isPluginRoute(routePath)) {
    return {
      ...PLUGIN_SECTION,
      label: matched?.label ?? '',
      order: PLUGIN_ORDER,
    };
  }

  return matched ?? OTHERS_SECTION;
}
