import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  storage: {
    title: 'ファイルストレージ',
    navDescription:
      'アップロードされたファイルの保存先と、ファイルを保存している機能',
    description: 'ストレージの設定と、各ディスクを使用する機能を確認できます。',
    checkAction: 'ストレージを確認',
    loading: 'ファイルストレージを読み込んでいます…',
    loadFailed: 'ファイルストレージを読み込めませんでした。',
    retry: '再試行',
    tabs: { disks: 'ストレージ', usages: '利用機能' },
    hints: {
      title_one: '{{count}} 件のお知らせ',
      title_other: '{{count}} 件のお知らせ',
      incomplete:
        'ディスク {{disk}} の設定が不完全です（{{problems}}）。使われていない間は影響ありませんが、選択されると失敗します。',
    },
    columns: {
      name: '名前',
      type: '種類 · 場所',
      visibility: '公開範囲',
      maxFileSize: 'ファイルサイズ上限',
      usages: '利用機能',
      status: '状態',
      feature: '機能',
      collection: 'ファイルテーブル',
      disk: '保存先',
      download: 'ダウンロード',
      files: 'ファイル',
      setting: '設定',
      value: '現在の値',
      source: '設定元',
    },
    default: '既定',
    details: '詳細',
    usageCount_one: '{{count}} 個の機能',
    usageCount_other: '{{count}} 個の機能',
    drivers: {
      fs: 'ローカルディスク',
      s3: 'S3 互換ストレージ',
      oss: 'Alibaba Cloud OSS',
      custom: 'カスタムドライバー',
    },
    location: {
      inApp: '{{path}}（アプリケーションディレクトリ内）',
      outsideApp: 'アプリケーションディレクトリ外',
      bucketMissing: 'bucket 未設定',
      unknown: 'コードで設定',
    },
    visibility: {
      private: '非公開',
      public: '公開',
      privateLong: '非公開：アプリケーション経由でのみダウンロード可能',
      publicLong: '公開：URL を知っていれば誰でもダウンロード可能',
      unknown: 'ドライバーが決定',
    },
    urls: {
      application: 'アプリケーションが配信（stream）',
      public: '公開 URL',
      signed: '有効期限付きの署名付き URL',
    },
    sizeMb: '{{size}} MB',
    status: {
      ok: '読み書き可能',
      failed: '確認失敗',
      incomplete: '設定が不完全',
      unchecked: '未確認',
      checkedAgo: '{{time}}に確認',
    },
    problems: {
      LOCATION_MISSING: 'location が空です',
      BUCKET_MISSING: 'bucket が空です',
      REGION_MISSING: 'region が空です',
      CREDENTIALS_MISSING: '認証情報がありません',
      REGION_INVALID: 'region は oss-<region> の形式である必要があります',
      CREDENTIALS_INVALID: '認証情報が 2 種類混在しているか無効です',
      SETTINGS_INVALID: 'timeout または domain が無効です',
      NOT_LOADED: 'アプリケーションに読み込まれていません',
    },
    sources: { code: 'コード', config: '設定', default: '既定値' },
    settings: {
      driver: '種類',
      location: '場所',
      visibility: '公開範囲',
      maxFileSize: 'ファイルサイズ上限',
      urls: 'ダウンロードリンク',
    },
    backToList: 'ファイルストレージ',
    defaultSubtitle:
      '新しくアップロードされたファイルは既定でここに保存されます。',
    notDefaultSubtitle: 'これを指定した機能だけが使用します。',
    notFound: 'ディスク {{disk}} は設定されていません。',
    howToChange: '変更方法',
    howToChangeNote:
      'Alibaba Cloud OSS（`oss`）やカスタムドライバーも使用できます。変更後は再デプロイし、リバースプロキシのリクエストボディ上限をファイルサイズ上限以上に引き上げてください。',
    check: {
      title: '確認',
      run: '確認',
      rerun: '再確認',
      running: '確認しています…',
      failed: '確認を実行できませんでした。',
      never:
        'このインスタンスの起動以降、このディスクはまだ確認されていません。',
      scope:
        'ディスクの `nocobase-check/` ディレクトリにある一時ファイルだけを書き込み、読み取り、削除します。業務ファイルには触れません。複数インスタンスの場合は、このインスタンスだけを確認します。',
      steps: {
        write: '一時ファイルを書き込む',
        read: '読み戻して内容を照合',
        url: 'ダウンロードリンクを作成',
        delete: '一時ファイルを削除',
      },
      details: {
        bytes: '{{bytes}} バイト一致',
        APPLICATION: 'アプリケーション経由で配信',
        PUBLIC: '公開 URL を作成しました',
        SIGNED: '署名付き URL を作成しました',
        deleted: '削除しました',
        skipped: 'スキップ',
      },
      reasons: {
        CONFIG_INCOMPLETE: '設定が不完全です：{{detail}}',
        DISK_UNAVAILABLE: 'ディスクを開けませんでした',
        WRITE_FAILED: '書き込みに失敗しました',
        READ_FAILED: '読み取りに失敗しました',
        CONTENT_MISMATCH: '読み戻した内容が一致しません',
        URL_FAILED: 'リンクを作成できませんでした',
        DELETE_FAILED: '削除に失敗しました',
        unknown: '失敗',
      },
    },
    usedBy: 'このディスクを使用している機能',
    noUsagesOnDisk: 'このディスクにファイルを保存している機能はありません。',
    download: {
      authenticated: 'ログインと権限が必要',
      public: '公開リンク',
    },
    diskDefault: '既定（{{disk}}）',
    diskConfig: '{{path}} → {{disk}}',
    diskConfigDefault: '{{path}} → 既定（{{disk}}）',
    plugin: '{{plugin}} プラグイン',
    application: 'アプリケーション',
    filesValue: '{{files}} ファイル · {{size}}',
    filesUnavailable: '集計できません',
    empty: {
      title: 'ファイルを保存している機能はまだありません',
      description:
        'ファイルテーブルはプラグインまたはアプリケーションコードが作成します。添付ファイルを持つプラグイン（プロジェクト、ナレッジベース、エージェントなど）をインストールすると、追加設定なしでここに表示されます。',
      defaultDisk:
        'ストレージ設定は引き続き適用されます。後から追加されるファイルテーブルは既定で {{disk}} にファイルを保存します。',
    },
    notes: {
      changeDefault:
        '既定のストレージの変更は、新しくアップロードするファイルにのみ適用されます。',
      deleteRecords:
        'レコードを削除しても、ディスク上のファイルは削除されません。',
      publicLinks:
        '公開リンクはログインせずに、リンクを知っている誰でも開けます。機密ファイルはプラグイン独自の認証付きルートで配信してください。',
      noBrowser:
        '全体のファイルブラウザーはありません。ファイルはそれぞれの機能に属し、各機能の権限に従って閲覧します。',
      readOnly:
        '利用機能はプラグインまたはアプリケーションコードで宣言されます（ファイルテーブル、ディスク、ダウンロード方法）。この一覧は読み取り専用で、ここでファイルテーブルを作成することはできません。',
    },
  },
  'files.ooxmlLoadFailed':
    'この Office Open XML ファイルをレンダリングできません。',
  'files.ooxmlLoadTimedOut':
    'プレビューのロードが {{minutes}} 分以内に完了しませんでした。',
  'files.previewRequestFailed':
    'プレビューリクエストが失敗しました（{{status}}）。',
  uploadFailed: 'ファイルのアップロードに失敗しました。',
  fileLimitReached: 'ファイル数が上限に達しました。',
  fileTooLarge: 'ファイルが最大サイズを超えています。',
  fileTypeNotAllowed: 'ファイルタイプは許可されていません。',
  removalFailed: 'ファイルの削除に失敗しました。',
  urlNotAllowed: 'ファイル URL は許可されません。',
  downloadFailed: 'ファイルのダウンロードに失敗しました。',
  invalidUrl: 'ファイル URL が見つからないか、許可されていません。',
  pdfPreviewFailed: 'PDF プレビューを読み込めません。',
  pdfPreviewMarkup:
    'ファイル URL は PDF ではなく HTML または XML を返しました。',
  previewFailed: 'ファイルプレビューを読み込めません。',
  'files.empty': 'ファイルがありません。',
  'files.preview': 'プレビュー',
  'files.download': 'ダウンロード',
  'files.remove': '削除',
  'files.chooseMany': 'ファイルを選択してください',
  'files.chooseOne': 'ファイルを選択してください',
  'files.retry': '再試行',
  'files.done': '完了',
  'files.uploading': 'アップロード中',
  'files.failed': '失敗しました',
  'files.pending': '保留中',
  'files.previous': '前のファイル',
  'files.next': '次のファイル',
  'files.loadingPreview': 'プレビューを読み込んでいます...',
  'files.downloadFile': 'ダウンロードファイル',
  'files.previewUnavailable':
    'このファイル形式ではプレビューを利用できません。',
  'files.imageFailed':
    'この画像は表示できませんでした。破損しているか、サポートされていない形式である可能性があります。',
  'files.officeFailed':
    'Office Online はこのファイルを読み込むことができませんでした。',
  'files.officeUrl':
    'Office Online には、インターネットからアクセスできる絶対ファイル URL が必要です。',
  'files.cancelFile': 'キャンセル {{filename}}',
  'files.status.uploading': 'アップロード中',
  'files.status.pending': '保留中',
  'files.status.error': '失敗しました',
};

export default jaJP;
