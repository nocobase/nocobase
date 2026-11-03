import type { AccountSwitcherResource } from './en-US.js';

const zhTW: AccountSwitcherResource = {
  menu: {
    switchAccount: '切換帳號',
    search: '搜尋姓名或電子郵件',
    loading: '正在載入帳號…',
    empty: '沒有符合的帳號',
    more: '還有 {{count}} 個帳號，請搜尋以縮小範圍。',
    loadFailed: '無法載入帳號。',
  },
  banner: {
    actingAs: '正在以 {{name}} 的身分操作',
    description: '所做的變更會記錄在此帳號下。',
    return: '返回 {{name}}',
  },
  errors: {
    switchFailed: '無法切換帳號，請再試一次。',
    returnFailed: '無法返回你的帳號，請再試一次。',
  },
};

export default zhTW;
