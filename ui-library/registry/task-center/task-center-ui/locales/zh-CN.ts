import type { TaskCenterUiLocale } from './en-US.js';

const zhCN: TaskCenterUiLocale = {
  taskCenterUi: {
    nav: {
      label: '待办来源',
      search: '搜索事项类型',
      noMatches: '没有匹配的事项类型',
      clearSearch: '清除搜索',
      expand: '展开{{name}}',
      collapse: '收起{{name}}',
      subjects: '{{name}}的事项类型',
      pending: '{{count}} 项待办',
    },
    tabs: {
      pending: '待办',
      closed: '已结',
      all: '全部',
    },
    groups: {
      today: '今天',
      yesterday: '昨天',
      earlier: '更早',
    },
    time: {
      received: '{{time}}收到',
      closed: '{{time}}结束',
    },
    selection: {
      select: '选择“{{name}}”',
      lockedTask: '“{{name}}”不可选：已选择{{type}}，只能同时选择同类事项',
      otherType: '已选择{{type}}，只能同时选择同类事项',
      unsupportedTask: '“{{name}}”不支持批量处理',
      unsupported: '此类事项需逐项处理',
    },
    bulk: {
      label: '批量操作',
      selected: '已选 {{count}} 项',
      clear: '取消选择',
      cancel: '取消',
      skipped: '另有 {{count}} 项不支持此操作，将保持不变。',
    },
    empty: {
      pending: {
        title: '都处理完了',
        description: '这里没有等你处理的事项。',
      },
      closed: {
        title: '还没有已结事项',
        description: '处理完成或被取消的事项会出现在这里。',
      },
      all: {
        title: '暂无事项',
        description: '此类事项到达后会出现在这里。',
      },
      showAll: '查看全部',
    },
    loading: '正在加载事项',
    pagination: {
      label: '分页',
      summary: '第 {{page}}/{{pages}} 页，共 {{total}} 项',
      previous: '上一页',
      next: '下一页',
    },
  },
};

export default zhCN;
