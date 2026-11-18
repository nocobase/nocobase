import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  access: {
    section: 'エージェントチーム',
    businessSection: 'エージェントチーム',
    businesses: {
      agents: {
        title: 'エージェントとスキル',
        description: 'チームのエージェントと彼らが使用するスキル。',
        actions: {
          edit: {
            title: 'Agentsとスキルの変更',
            description:
              'Agentの設定、スキル、変数の変更、アーカイブ、復元、削除、スキルの編集を行います。Agentには編集者以上の権限は与えられません',
            related: 'Agentsとスキルの変更（所有するAgentsと作成したスキル）',
            relatedLabel: '私が所有するエージェントと私が作成したスキル',
            relatedHint: '私がオーナーであるエージェントと私が作成したスキル',
            all: 'チェンジAgentsとスキル(全て)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'エージェント',
        runners: '実行環境',
        prices: 'モデルの価格',
        services: 'モデルサービス',
      },
    },
    actions: {
      read: '表示',
      manage: '管理する',
    },
    keyScopes: {
      agents: {
        title: 'エージェント',
        description:
          'Agents、スキル、ランを参照。Agentsとスキルを変更し、実行をキャンセルして再試行します。',
      },
      runners: {
        title: '実行環境',
        description: '実行環境と登録トークンを参照。実行環境を管理します。',
      },
      prices: {
        title: 'モデルの価格',
        description:
          'モデルの価格を参照してください。コストは以下から推定されます。それらを変更してください。',
      },
      services: {
        title: 'モデルサービス',
        description:
          'モデル サービスとそれらが提供するモデルを参照し、そのキーを参照しないでください。',
      },
    },
  },
  runnerConversation: {
    title: '会話：{{title}}',
    other: '他の人の会話',
    untitled: '新しい会話',
  },
};

export default jaJP;
