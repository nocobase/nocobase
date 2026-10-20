import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  access: {
    section: 'リリース',
    pages: {
      'rel-apps': 'アプリ',
    },
    businessSection: 'リリース',
    businesses: {
      apps: {
        title: 'アプリ',
        description: 'アプリ、そのリリース、デプロイメント、およびランタイム。',
        actions: {
          view: {
            title: 'アプリを見る',
            description:
              'アプリ、そのリリース、デプロイメント、実行時のステータスを参照',
            related: 'アプリ（関連アプリ）を見る',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'アプリを見る(すべて)',
          },
          readLogs: {
            title: 'ログの読み取り',
            description: 'アプリと展開ログの読み取り',
            related: '読み取りログ（関連するもの）',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: '読み取りログ(すべて)',
          },
          create: {
            title: 'アプリの作成',
            description: '環境内でアプリを作成する',
            all: 'アプリの作成',
          },
          configure: {
            title: 'アプリの設定',
            description:
              '秘密が保持されている可能性があるアプリの設定の読み取りと変更',
            related: 'アプリの設定（アプリに関連するもの）',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'アプリの設定(すべて)',
          },
          upload: {
            title: 'リリースのアップロード',
            description: 'リリースのアップロードと宣伝',
            related: 'リリース（関連するもの）をアップロードします',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'リリースのアップロード (すべて)',
          },
          deploy: {
            title: 'デプロイ',
            description:
              '保護されていない環境での展開とロールバック、保護された環境への展開のリクエスト',
            related: 'デプロイ（それらに関連するもの）',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'デプロイ(すべて)',
          },
          deployProtected: {
            title: '保護された展開を承認する',
            description:
              '承認者を指定しない保護された環境への展開を承認します。人のみ',
            related:
              '保護されたデプロイメント (それらに関連するもの) を承認する',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: '保護された展開を承認する (すべて)',
          },
          operate: {
            title: 'スタートとストップ',
            description: 'アプリの開始、停止、再起動',
            related: 'スタートとストップ（それらに関連するもの）',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'スタートとストップ(すべて)',
          },
          delete: {
            title: 'アプリの削除',
            description: 'アプリとそのデータを削除する',
            related: 'アプリ（関連アプリ）の削除',
            relatedLabel: '私が作ったもの',
            relatedHint:
              '私が作成したアプリ、および私に関連するアプリケーション',
            all: 'アプリの削除(すべて)',
          },
        },
      },
    },
    recordAccess: {
      owned: '作成したアプリ',
    },
    settings: {
      rel: {
        environments: '環境の展開',
      },
    },
    keyScopes: {
      apps: {
        title: 'アプリと展開',
        description:
          '読み取り: アプリ、リリース、デプロイメント、およびログを参照します。読み取りと書き込み: リリースのアップロードも行います。管理者: アプリのデプロイと開始または停止も行います。',
        objects: 'アプリ',
      },
      environments: {
        title: '環境の展開',
        description:
          '読み取り: 環境のリスト。読み取りと書き込み: それらを管理します。',
      },
      presets: {
        ciDeploy: {
          title: 'CIのデプロイ',
          description:
            '選択したアプリにリリースをアップロードし、90 日間展開します。',
        },
        ciUpload: {
          title: 'CIアップロード',
          description:
            '90 日間、選択したアプリにリリースをデプロイせずにアップロードします。',
        },
      },
    },
    actions: {
      read: '表示',
      manage: '管理する',
      view: '表示',
      'read-logs': 'ログの読み取り',
      create: '作成',
      configure: '設定する',
      upload: 'リリースのアップロード',
      deploy: 'デプロイ',
      'deploy-protected': '保護された展開を承認する',
      operate: 'スタートとストップ',
      delete: '削除',
    },
  },
  drivers: {
    host: 'このサーバー',
  },
};

export default jaJP;
