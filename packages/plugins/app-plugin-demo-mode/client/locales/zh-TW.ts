import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: '示範資料',
    read: '檢視',
    manage: '產生與清空',
    configuration: '示範設定',
    configure: '設定',
  },
  accounts: {
    title: '示範帳號',
    description: '以下列任一帳號進入示範，看看每個角色看到的系統。',
    enter: '進入',
    signedInAs: '目前：{{name}} · 切換',
    current: '目前',
    entering: '正在進入…',
    failed: '無法進入這個示範帳號。',
    unavailable: '目前沒有可進入的示範帳號。',
    password: '使用密碼登入',
  },
  refused: {
    title: '示範模式無法儲存變更。',
    description: '其他功能可照常瀏覽。',
  },
};
export default resource;
