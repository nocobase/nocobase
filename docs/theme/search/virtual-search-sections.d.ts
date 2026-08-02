declare module 'virtual-search-sections' {
  import type { SearchSectionTable } from '../../shared/searchSections';

  /** 构建期由 `plugins/pluginSearchSections.ts` 生成的顶层目录 → 分组映射表。 */
  export const searchSections: SearchSectionTable;
}
