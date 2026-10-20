import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  navigation: {
    tasks: '通知例',
    taskManagement: 'タスク',
    taskDetail: 'タスクの詳細',
  },
  common: {
    close: '閉じる',
    loading: '読み込み中…',
    saving: '保存中…',
  },
  fields: {
    title: 'タイトル',
    description: '説明',
    status: '状態',
    assignee: '担当者',
    creator: 'クリエイター',
    chooseAssignee: 'ユーザーを選択してください',
  },
  status: {
    open: 'オープン',
    'in-progress': '進行中',
    done: '完了',
  },
  tasks: {
    title: 'タスク',
    description:
      '別のユーザーに小さなタスクを割り当てます。担当者はタスクの概要を含むアプリ内通知を受け取り、詳細ページからタスクを編集できます。上部バーの通知ボタンを使用して、メッセージ通知を開きます。',
    listTitle: 'すべてのタスク',
    listDescription: 'あなたが作成した、または割り当てられたすべてのタスク。',
    count: '{{count}} レコード',
    empty: 'まだタスクがありません。',
    assignee: '配属先',
    columns: {
      title: 'タイトル',
      description: '説明',
      status: '状態',
      creator: 'クリエイター',
      assignee: '担当者',
      updatedAt: '最終更新日',
      actions: '操作',
    },
    view: '詳細を見る',
    refresh: '更新',
    previous: '前へ',
    next: '次へ',
    page: 'ページ {{page}}',
    add: '新しい任務',
    drawerTitle: '新しい任務',
    drawerDescription:
      'タスクを作成すると、その基本情報が担当者に送信されます。',
    create: 'タスクの作成',
    cancel: 'キャンセル',
  },
  taskDetail: {
    title: 'タスクの詳細',
    summary: 'タスクの詳細',
    createdAt: '作成しました',
    updatedAt: '最終更新日',
    notificationHint:
      'タスクが保存されると、現在の編集者以外の関係者、つまり作成者と現在の担当者に通知されます。担当者が変更されると、以前の担当者と新しい担当者の両方に通知されます。',
    edit: 'タスクの編集',
    refresh: '更新',
    save: '変更を保存する',
    cancel: 'キャンセル',
    back: 'タスクに戻る',
  },
};

export default jaJP;
