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
      issues: 'タスク',
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
        title: 'タスク',
        description: 'プロジェクト内または単独のタスクとそのコメント。',
        actions: {
          view: {
            title: 'タスクを表示',
            description: '一覧、ボード、詳細でタスクを表示します',
            related: 'タスクを表示（閲覧できるもの）',
            relatedLabel: '私が見ることができるプロジェクトでは',
            relatedHint:
              'プロジェクトのないタスクと、閲覧できるプロジェクトのタスク',
            all: 'タスクを表示（すべて）',
          },
          create: {
            title: 'タスクを作成',
            description: 'プロジェクト内または単独でタスクを作成します',
            related: 'タスクを作成（閲覧できるプロジェクト内）',
            relatedLabel: '私が見ることができるプロジェクトでは',
            relatedHint:
              'プロジェクトのないタスク、または閲覧できるプロジェクトのタスク',
            all: 'タスクを作成（すべて）',
          },
          edit: {
            title: 'タスクを編集',
            description:
              'タイトル、説明、優先度、日付、ラベル、実行者、未完了のステータス',
            related: 'タスクを編集（閲覧できるもの）',
            relatedLabel: '私が見ることができるプロジェクトでは',
            relatedHint:
              'プロジェクトのないタスクと、閲覧できるプロジェクトのタスク',
            all: 'タスクを編集（すべて）',
          },
          comment: {
            title: 'タスクにコメント',
            description:
              'スレッドにコメント、返信、解決します。自分のコメントを編集および削除する',
            related: 'タスクにコメント（閲覧できるもの）',
            relatedLabel: '私が見ることができるプロジェクトでは',
            relatedHint:
              'プロジェクトのないタスクと、閲覧できるプロジェクトのタスク',
            all: 'タスクにコメント（すべて）',
          },
          moderateComments: {
            title: '適度なコメント',
            description: '他の人のコメントを削除する',
            related:
              'コメントの管理（担当しているタスクまたは主導しているプロジェクト）',
            relatedLabel: '担当しているタスクまたは主導しているプロジェクト',
            relatedHint:
              '担当しているタスクと、主導しているプロジェクトのタスクへのコメント',
            all: '適度なコメント（すべて）',
          },
          close: {
            title: 'タスクを閉じる',
            description: 'タスクを完了またはキャンセルにします',
            related:
              'タスクを閉じる（担当しているもの、または主導しているプロジェクト）',
            relatedLabel:
              '私が所有しているもの、または私が主導するプロジェクトのもの',
            relatedHint:
              '担当しているタスクと、主導しているプロジェクトのタスク',
            all: 'タスクを閉じる（すべて）',
          },
          changeOwner: {
            title: '所有者を変更する',
            description: 'タスクを別の人に引き継いで責任を持ってもらいます',
            related: '所有者を変更する (所有者または自分が率いるプロジェクト)',
            relatedLabel:
              '私が所有しているもの、または私が主導するプロジェクトのもの',
            relatedHint:
              '担当しているタスクと、主導しているプロジェクトのタスク',
            all: '所有者変更(全て)',
          },
          delete: {
            title: 'タスクの削除と復元',
            description: 'タスクを削除し、削除されたタスクを復元します',
            all: 'タスクの削除と復元',
          },
        },
      },
      attachments: {
        title: 'アタッチメント',
        description: 'タスクとコメントに添付されたファイル。',
        actions: {
          upload: {
            title: '添付ファイルのアップロード',
            description:
              '編集できるタスクと自分のコメントにファイルを添付します',
            related: '添付ファイルのアップロード（閲覧できるタスク）',
            relatedLabel: '閲覧できるプロジェクトのタスク',
            relatedHint:
              'プロジェクトのないタスクと、閲覧できるプロジェクトのタスクにあるファイル',
            all: '添付ファイルのアップロード（すべて）',
          },
        },
      },
    },
    collections: {
      pmProjects: 'プロジェクト',
      pmIssues: 'タスク',
    },
    recordAccess: {
      visible: '閲覧できるプロジェクトとタスク',
      managed: '主導しているプロジェクトと担当しているタスク',
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
        title: 'タスク',
        description:
          'タスクの表示、作成、編集、コメント、クローズ、再割り当て、コメントの管理、タスクの削除。',
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
    batchDone: '{{identifier}} のすべてのサブタスクが完了しました',
    batchDoneStage:
      '{{identifier}} のサブタスクのステージ {{stage}} が完了しました',
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
