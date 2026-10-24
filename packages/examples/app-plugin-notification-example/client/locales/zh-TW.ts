import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  navigation: {
    tasks: '通知範例',
    taskManagement: '任務',
    taskDetail: '任務詳情',
  },
  common: {
    close: '關閉',
    loading: '載入中…',
    saving: '正在儲存...',
  },
  fields: {
    title: '標題',
    description: '說明',
    status: '狀態',
    assignee: '受指派人',
    creator: '創作者',
    chooseAssignee: '選擇使用者',
  },
  status: {
    open: '開啟',
    'in-progress': '進行中',
    done: '已完成',
  },
  tasks: {
    title: '任務',
    description:
      '將一個小任務分配給另一個使用者。受讓人收到包含任務摘要的應用程式內通知，並可從詳細資料頁面編輯任務。使用頂部欄中的通知按鈕開啟訊息通知。',
    listTitle: '所有任務',
    listDescription: '您建立或分配給的所有任務。',
    count: '{{count}} 記錄',
    empty: '還沒有任務。',
    assignee: '分配給',
    columns: {
      title: '標題',
      description: '說明',
      status: '狀態',
      creator: '創作者',
      assignee: '受指派人',
      updatedAt: '最後更新',
      actions: '操作',
    },
    view: '檢視詳情',
    refresh: '重新整理',
    previous: '上一步',
    next: '下一步',
    page: '頁{{page}}',
    add: '新任務',
    drawerTitle: '新任務',
    drawerDescription: '建立任務會將其基本資訊傳送給受讓人。',
    create: '建立任務',
    cancel: '取消',
  },
  taskDetail: {
    title: '任務詳情',
    summary: '任務詳情',
    createdAt: '已建立',
    updatedAt: '最後更新',
    notificationHint:
      '任務儲存後，會通知當前編輯者以外的相關人員：建立者和當前受讓人。如果受託人發生變化，先前的受託人和新的受託人都會收到通知。',
    edit: '編輯任務',
    refresh: '重新整理',
    save: '儲存更改',
    cancel: '取消',
    back: '返回任務',
  },
};

export default zhTW;
