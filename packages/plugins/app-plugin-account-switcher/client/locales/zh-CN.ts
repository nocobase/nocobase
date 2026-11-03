import type { AccountSwitcherResource } from './en-US.js';

const zhCN: AccountSwitcherResource = {
  menu: {
    switchAccount: '切换账号',
    search: '搜索姓名或邮箱',
    loading: '正在加载账号…',
    empty: '没有匹配的账号',
    more: '还有 {{count}} 个账号，请搜索以缩小范围。',
    loadFailed: '无法加载账号。',
  },
  banner: {
    actingAs: '正在以 {{name}} 的身份操作',
    description: '所做的更改会记录在该账号下。',
    return: '返回 {{name}}',
  },
  errors: {
    switchFailed: '无法切换账号，请重试。',
    returnFailed: '无法返回你的账号，请重试。',
  },
};

export default zhCN;
