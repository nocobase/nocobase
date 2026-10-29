import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  access: {
    section: '代理團隊',
    businessSection: '代理團隊',
    businesses: {
      agents: {
        title: '代理與技能',
        description: '團隊的代理人及其所使用的技能。',
        actions: {
          edit: {
            title: '改變代理人和技能',
            description:
              '更改代理的設定、技能和變數、存檔、恢復和刪除以及編輯技能。代理人沒有被賦予編輯者自己以外的任何能力',
            related: '改變代理人和技能（他們擁有的代理人和他們建立的技能）',
            relatedLabel: '我擁有的代理和我建立的技能',
            relatedHint: '我擁有的代理以及我建立的技能',
            all: '變更代理人與技能（全部）',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: '代理',
        runners: '執行環境',
        prices: '型號價格',
        services: '模特兒服務',
      },
    },
    actions: {
      read: '檢視',
      manage: '管理',
    },
    keyScopes: {
      agents: {
        title: '代理',
        description: '檢視代理、技能和跑動；更改代理和技能，取消並重試執行。',
      },
      runners: {
        title: '執行環境',
        description: '檢視執行器和註冊令牌；管理執行器。',
      },
      prices: {
        title: '型號價格',
        description: '檢視模型價格成本估算：改變他們。',
      },
      services: {
        title: '模特兒服務',
        description: '檢視模型服務和他們提供的模型，而不是他們的金鑰。',
      },
    },
  },
  runnerConversation: {
    title: '對話：{{title}}',
    other: '他人對話',
    untitled: '新對話',
  },
};

export default zhTW;
