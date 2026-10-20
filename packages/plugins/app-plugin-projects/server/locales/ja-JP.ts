import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  roles: {
    owner: 'オーナー',
    admin: '管理者',
    member: 'メンバー',
  },
  access: {
    sections: {
      projects: 'プロジェクト',
      issues: '課題',
      settings: 'プロジェクト設定',
      members: 'メンバーと役割',
    },
    businesses: {
      projects: {
        title: 'プロジェクト',
        description: 'プロジェクト、そのメンバー、リポジトリ、および進捗状況。',
        actions: {
          view: {
            title: 'プロジェクトを見る',
            description: 'プロジェクト、その概要、進捗状況を表示',
            related: 'プロジェクトの表示 (自分が見ることができるもの)',
            relatedLabel: '見えるもの',
            relatedHint:
              '私が主導または参加した公共プロジェクトとプライベートプロジェクト',
            all: 'プロジェクトを見る(すべて)',
          },
          create: {
            title: 'プロジェクトの作成',
            description: '新しいプロジェクトを開始して主導する',
            all: 'プロジェクトの作成',
          },
          manage: {
            title: 'プロジェクトの管理',
            description:
              '名前の変更、ステータス、日付とリードの変更、メンバーとリポジトリの管理',
            related: 'プロジェクトを管理する (自分が率いるプロジェクト)',
            relatedLabel: '私が導くもの',
            relatedHint: '私がリーダーを務めるプロジェクト',
            all: 'プロジェクトの管理(すべて)',
          },
          delete: {
            title: 'プロジェクトの削除',
            description: 'プロジェクトの削除と削除されたプロジェクトの復元',
            all: 'プロジェクトの削除',
          },
        },
      },
      issues: {
        title: '課題',
        description: 'プロジェクト内または独自の問題点とそのコメント。',
        actions: {
          view: {
            title: '問題を見る',
            description: 'リスト、ボード、およびその詳細で問題を確認する',
            related: '問題を表示 (自分が確認できる問題)',
            relatedLabel: '私が見ることができるプロジェクトでは',
            relatedHint:
              'プロジェクトのない問題と、私から見えるプロジェクトの課題',
            all: '問題を表示 (すべて)',
          },
          create: {
            title: '問題の作成',
            description: 'プロジェクト内または独自に問題を作成する',
            related: '課題を作成する (閲覧できるプロジェクト内)',
            relatedLabel: '私が見ることができるプロジェクトでは',
            relatedHint:
              'プロジェクトのない問題、またはプロジェクト内で確認できる問題',
            all: '課題の作成(すべて)',
          },
          edit: {
            title: '編集問題',
            description:
              'タイトル、説明、優先度、日付、ラベル、執行者、オープンステータス',
            related: '問題を編集する (閲覧できる問題)',
            relatedLabel: '私が見ることができるプロジェクトでは',
            relatedHint:
              'プロジェクトのない問題と、私から見えるプロジェクトの課題',
            all: '問題の編集 (すべて)',
          },
          comment: {
            title: '問題についてコメントする',
            description:
              'スレッドにコメント、返信、解決します。自分のコメントを編集および削除する',
            related: '問題についてコメントする (自分が認識できる問題)',
            relatedLabel: '私が見ることができるプロジェクトでは',
            relatedHint:
              'プロジェクトのない問題と、私から見えるプロジェクトの課題',
            all: '問題点へのコメント(すべて)',
          },
          moderateComments: {
            title: '適度なコメント',
            description: '他の人のコメントを削除する',
            related:
              '適度なコメント (自分が所有する問題、または自分が主導するプロジェクトについて)',
            relatedLabel:
              '私が所有する問題、または私が主導するプロジェクトについて',
            relatedHint:
              '私が所有する問題、および私が主導するプロジェクトの問題についてのコメント',
            all: '適度なコメント（すべて）',
          },
          close: {
            title: '課題をクローズ',
            description: '問題を完了またはキャンセルとしてマークします',
            related:
              '問題を解決する (自分が所有する問題、または自分が主導するプロジェクト)',
            relatedLabel:
              '私が所有しているもの、または私が主導するプロジェクトのもの',
            relatedHint: '私が所有する問題と私が主導するプロジェクトの問題',
            all: '問題を解決する (すべて)',
          },
          changeOwner: {
            title: '所有者を変更する',
            description: '責任を負うために問題を他の人に引き渡す',
            related: '所有者を変更する (所有者または自分が率いるプロジェクト)',
            relatedLabel:
              '私が所有しているもの、または私が主導するプロジェクトのもの',
            relatedHint: '私が所有する問題と私が主導するプロジェクトの問題',
            all: '所有者変更(全て)',
          },
          delete: {
            title: '問題の削除と復元',
            description: '問題を削除し、削除した問題を復元する',
            all: '問題の削除と復元',
          },
        },
      },
      attachments: {
        title: 'アタッチメント',
        description: '問題とコメントに添付されたファイル。',
        actions: {
          upload: {
            title: '添付ファイルのアップロード',
            description: '編集可能な問題およびコメントにファイルを添付する',
            related: '添付ファイルをアップロードする (確認できる問題について)',
            relatedLabel: 'プロジェクトの問題点について',
            relatedHint:
              'プロジェクトのない問題に関するファイル、および確認できるプロジェクト内の課題に関するファイル',
            all: '添付ファイルのアップロード（すべて）',
          },
        },
      },
    },
    collections: {
      pmProjects: 'プロジェクト',
      pmIssues: '課題',
    },
    recordAccess: {
      visible: '見えてくるプロジェクトと課題',
      managed: '彼らが率いるプロジェクトと彼らが所有する問題',
    },
    settings: {
      pm: {
        general: '一般',
        labels: 'ラベル',
        members: 'メンバー',
      },
    },
    keyScopes: {
      projects: {
        title: 'プロジェクト',
        description:
          'プロジェクトを参照。それらを管理します。それらを作成および削除します。',
        objects: 'プロジェクト',
      },
      issues: {
        title: '課題',
        description:
          '問題を参照。それらを作成、編集、コメントし、閉じ、再割り当てします。コメントを管理し、問題を削除します。',
      },
      settings: {
        title: 'プロジェクト設定',
        description: '一般的な設定とラベル。',
      },
    },
    actions: {
      view: '表示',
      create: '作成',
      manage: '管理する',
      edit: '編集',
      close: '閉じる',
      comment: 'コメント',
      moderateComments: '適度なコメント',
      changeOwner: '所有者の変更',
      delete: '削除',
      upload: 'アップロード',
      read: '表示',
      update: '編集',
      invite: '招待する',
      assign: '役割を割り当てる',
      'define-roles': '役割を定義する',
    },
  },
  notifications: {
    batchDone: '{{identifier}}のすべてのサブイシューが終了しました',
    batchDoneStage: '{{identifier}}のサブ号のステージ{{stage}}が終了しました',
    commented: '{{actor}} が {{identifier}} にコメントしました',
    dependencyReleased:
      '{{releasedBy}} が終了したので、{{identifier}} を開始できます',
    executorAssigned: '{{actor}} があなたに {{identifier}} を割り当てました',
    mentioned: {
      comment: '{{actor}} が {{identifier}} であなたのことをメンションしました',
      description: '{{actor}} が {{identifier}} であなたについて言及しました',
    },
    ownerAssigned: '{{actor}} はあなたを {{identifier}} のオーナーにしました',
    someone: '誰か',
    statusChanged: '{{identifier}} は {{status}} に移動しました',
    ownerNotified: '{{identifier}} は {{status}} になりました',
  },
  status: {
    backlog: 'バックログ',
    blocked: 'ブロック中',
    cancelled: 'キャンセル済み',
    done: '完了',
    in_progress: '進行中',
    in_review: 'レビュー中',
  },
};

export default jaJP;
