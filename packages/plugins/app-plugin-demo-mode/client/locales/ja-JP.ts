import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'デモデータ',
    read: '表示',
    manage: '生成と消去',
    configuration: 'デモ設定',
    configure: '設定',
  },
  accounts: {
    title: 'デモアカウント',
    description:
      'いずれかのアカウントでデモに入り、それぞれの役割から見た画面を確認できます。',
    enter: '入る',
    signedInAs: '{{name}} でサインイン中 · 切り替え',
    current: '現在',
    entering: '入っています…',
    failed: 'このデモアカウントに入れませんでした。',
    unavailable: '現在入れるデモアカウントはありません。',
    password: 'パスワードでサインイン',
  },
  refused: {
    title: 'デモのため変更を保存できません。',
    description: 'その他の機能は通常どおり利用できます。',
  },
};
export default resource;
