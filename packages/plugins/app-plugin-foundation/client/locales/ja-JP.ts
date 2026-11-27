import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  nav: {
    plugins: 'プラグイン',
    pluginsDescription:
      'このアプリが使っているプラグインとそのバージョン、ほかのプラグインを有効にする方法。',
  },
  access: {
    section: 'システム',
    settings: {
      plugins: 'プラグイン',
    },
    actions: {
      read: '表示',
    },
  },
  page: {
    title: 'プラグイン',
    description:
      'このアプリが使っているプラグインです。有効化や無効化はアプリのコードを変更し、再起動後に反映されるため、ここにはスイッチではなく実行するコマンドを表示します。',
    deployed:
      'プラグインを有効にするには、ソースプロジェクトで登録してからアプリケーションを再デプロイしてください。',
    attention_one:
      '{{count}} 件のプラグインに注意が必要です。先頭に表示しています。',
    attention_other:
      '{{count}} 件のプラグインに注意が必要です。先頭に表示しています。',
    search: '名前またはパッケージ名で検索',
    loading: 'プラグインを読み込んでいます…',
    loadFailed: 'プラグインを読み込めませんでした。',
    retry: '再試行',
    empty: '条件に合うプラグインはありません。',
  },
  filters: {
    label: '表示',
    all: 'すべて {{count}}',
    enabled: '有効 {{count}}',
    disabled: '未有効 {{count}}',
    attention: '要注意 {{count}}',
  },
  columns: {
    plugin: 'プラグイン',
    version: 'バージョン',
    status: '状態',
    actions: '操作',
  },
  groups: {
    enabled: '有効 {{count}}',
    disabled: '未有効 {{count}}',
  },
  status: {
    enabled: '有効',
    skillsOnly: '有効 · Skill のみ',
    enabledAttention: '有効 · 要注意',
    disabled: '未有効',
    disabledAttention: '未有効 · 要注意',
    unknown: '確認できません · 再ビルドが必要',
  },
  reasons: {
    partial:
      '一部だけ有効になっています。ページは開きますが、データが読み込まれません。有効化コマンドをもう一度実行すると直ります。',
    devDependency:
      '有効ですが、デプロイ時に含まれないため、本番のアプリではこのプラグインが欠けます。有効化コマンドをもう一度実行すると直ります。',
    missingRequires:
      '「{{title}}」には {{names}} が必要ですが、有効になっていません。',
    other:
      'このアプリで完全には組み込まれていません。有効化コマンドをもう一度実行すると直ります。',
    requiresFirst:
      '先に有効化が必要：{{names}}（有効化コマンドに含まれています）',
    unknown:
      'このアプリはコマンドラインに登録されたプラグインを記録する前にビルドされたため、有効かどうかをここでは確認できません。pnpm build をもう一度実行してデプロイすると表示されます。',
  },
  actions: {
    commands: 'コマンド',
    commandsFor: '{{title}} のコマンド',
    enable: '有効化の方法',
    enableFor: '{{title}} を有効にする方法',
  },
  commands: {
    title: '{{title}} のコマンド',
    description:
      'アプリのコードディレクトリで実行し、再起動してください。本番のアプリでは再ビルドしてデプロイします。',
    fix: '要注意の問題を直します',
    update: '最新バージョンに更新します',
    unregister: '無効にします。データは残ります',
    dependents:
      'これに依存する有効なプラグイン：{{names}}。一緒に無効にしてください。',
    noDependents:
      'これに依存する有効なプラグインはないため、単独で無効にできます。',
    optionalDependents:
      'これを任意で使う有効なプラグイン：{{names}}。無効にしても動作しますが、これを必要とする機能は使えなくなります。',
  },
  enable: {
    title: '{{title}} を有効にする',
    description: 'アプリのコードディレクトリで実行します：',
    requires:
      '{{title}} は {{names}} に依存していますが、まだ有効になっていないため、コマンドに含めています。',
    development:
      'ローカル開発：実行後に pnpm dev を再起動し、このページを再読み込みすると有効になっています。',
    live: '本番のアプリ：変更をコミットし、pnpm build --tar を実行してからインストーラーでアップグレードします。',
    data: '初回起動時にテーブルが作成されます。後で plugin unregister で無効にしてもデータは残ります。',
  },
  dialog: {
    copy: 'コマンドをコピー',
    copied: 'コピーしました',
    copyFailed:
      'コピーできませんでした。コマンドを選択してコピーしてください。',
    close: 'OK',
  },
};

export default jaJP;
