/**
 * Rspress 在构建期把 `search.searchHooks` 指向的模块 re-export 成这个虚拟模块
 * （见 `@rspress/core/dist/node/runtimeModule/searchHooks.js`）。
 * 这里声明它的类型，让 vendor 过来的 SearchPanel 不用 `any` 也能通过类型检查。
 *
 * 四个钩子都按「一定存在」声明：调用方本来就用 `'onSearch' in userSearchHooks` 先判断过，
 * 声明成可选反而会让那些 `in` 收窄之后的调用点报「可能为 undefined」。
 */
declare module 'virtual-search-hooks' {
  import type {
    AfterSearch,
    BeforeSearch,
    OnSearch,
    RenderSearchFunction,
  } from '@rspress/core/theme';

  export const beforeSearch: BeforeSearch;
  export const onSearch: OnSearch;
  export const afterSearch: AfterSearch;
  export const render: RenderSearchFunction;
}
