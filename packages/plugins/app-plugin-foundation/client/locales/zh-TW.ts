import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  nav: {
    plugins: '外掛',
    pluginsDescription:
      '這個應用用了哪些外掛、各是什麼版本，以及怎樣啟用其他外掛。',
  },
  access: {
    section: '系統',
    settings: {
      plugins: '外掛',
    },
    actions: {
      read: '檢視',
    },
  },
  page: {
    title: '外掛',
    description:
      '這個應用用了哪些外掛。啟用和停用要改應用程式碼、重新啟動後生效，所以這裡不放開關，只給出要執行的命令。',
    deployed:
      '這是部署後的應用：只顯示隨應用部署的外掛。開發時可見的外掛不在這裡。',
    attention_one: '{{count}} 個外掛需要注意，已排在最前面。',
    attention_other: '{{count}} 個外掛需要注意，已排在最前面。',
    search: '搜尋名稱或套件名',
    loading: '正在讀取外掛…',
    loadFailed: '外掛清單讀取失敗。',
    retry: '重試',
    empty: '沒有符合條件的外掛。',
  },
  filters: {
    label: '顯示',
    all: '全部 {{count}}',
    enabled: '已啟用 {{count}}',
    disabled: '未啟用 {{count}}',
    attention: '需要注意 {{count}}',
  },
  columns: {
    plugin: '外掛',
    version: '版本',
    status: '狀態',
    actions: '操作',
  },
  groups: {
    enabled: '已啟用 {{count}}',
    disabled: '未啟用 {{count}}',
  },
  status: {
    enabled: '已啟用',
    skillsOnly: '已啟用 · 只含 Skill',
    enabledAttention: '已啟用 · 需要注意',
    disabled: '未啟用',
    preinstalled: '未啟用 · 開發時可見',
    disabledAttention: '未啟用 · 需要注意',
    unknown: '無法確認 · 需重新建置',
  },
  reasons: {
    partial:
      '只啟用了一部分：頁面能開啟，但資料載入不出來。再執行一次啟用命令即可修復',
    devDependency:
      '啟用了，但部署時不會帶上，線上會缺這個外掛。再執行一次啟用命令即可修復',
    missingRequires: '「{{title}}」需要「{{names}}」，它還沒啟用',
    other: '在這個應用裡沒有裝配完整。再執行一次啟用命令即可修復',
    requiresFirst: '需要先啟用：{{names}}（啟用命令已帶上）',
    unknown:
      '這個應用建置時還沒有記錄命令列註冊了哪些外掛，這裡無法確認它是否已啟用。重新執行 pnpm build 並部署後即可看到。',
  },
  actions: {
    commands: '命令',
    commandsFor: '{{title}} 的命令',
    enable: '啟用方法',
    enableFor: '啟用 {{title}} 的方法',
  },
  commands: {
    title: '{{title}} 的命令',
    description: '在應用的程式碼目錄執行；改完重新啟動，線上要重新建置部署。',
    fix: '修復需要注意的問題',
    update: '更新到新版本',
    unregister: '停用，資料保留',
    dependents: '依賴它的已啟用外掛：{{names}}。需要一起停用。',
    noDependents: '依賴它的已啟用外掛：無，可以直接停用。',
    optionalDependents:
      '選用它的已啟用外掛：{{names}}。停用後它們仍能使用，只是少了依賴它的功能。',
  },
  enable: {
    title: '啟用 {{title}}',
    description: '在應用的程式碼目錄執行：',
    requires: '{{title}}依賴{{names}}，它也還沒啟用，命令裡已經帶上。',
    development:
      '本機開發：執行後重新啟動 pnpm dev，重新整理這個頁面就能看到它已啟用。',
    live: '線上：提交程式碼，pnpm build --tar 後用安裝器升級。',
    data: '首次啟動會建立它的資料表。之後用 plugin unregister 停用，資料保留。',
  },
  dialog: {
    copy: '複製命令',
    copied: '已複製',
    copyFailed: '複製失敗，請選取命令後手動複製。',
    close: '知道了',
  },
};

export default zhTW;
