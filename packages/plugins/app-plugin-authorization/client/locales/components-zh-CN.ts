import type { LocaleResource } from '@nocobase/i18n';

import type componentsEnUS from './components-en-US.js';

const components: LocaleResource<typeof componentsEnUS> = {
  actions: {
    close: '关闭',
  },
  dataTable: {
    noResults: '无结果',
    sortAscending: '升序',
    sortDescending: '降序',
    sort: '排序',
    sortBy: '排序方式',
    filters: '筛选',
    filtersApplied: '筛选 · {{count}}',
    selectPage: '全选本页',
    hideColumn: '隐藏',
    view: '视图',
    toggleColumns: '显示列',
    selectedCount: '已选择 {{selected}} / {{total}} 行。',
    rowsPerPage: '每页行数',
    pageOf: '第 {{page}} 页，共 {{pageCount}} 页',
    firstPage: '第一页',
    previousPage: '上一页',
    nextPage: '下一页',
    lastPage: '最后一页',
  },
  formFeedback: {
    field: '此字段的值未通过校验，请检查并修改后重试。',
    invalid: '请检查标记的字段后重试。',
    failed: '保存失败，已保留您的输入，请重试。',
    network: '无法连接，请检查网络后重试。已保留您的输入。',
    denied: '当前权限无法提交此表单。已保留您的输入。',
  },
  listFeedback: {
    loading: '加载中',
    empty: '暂无数据',
    noResults: '无结果',
    forbidden: '无权访问',
    unauthenticated: '会话已过期',
    failed: '列表加载失败',
    refreshFailed: '刷新失败，仍显示旧数据',
    retry: '重试',
    retrying: '正在重试…',
    clear: '清空筛选',
    signIn: '登录',
  },
  status: {
    loading: '加载中',
    refreshing: '刷新中',
  },
  pendingFeedback: {
    working: '正在处理…',
    longWait: '耗时比平常更长，您可以继续等待。',
  },
};

export default components;
