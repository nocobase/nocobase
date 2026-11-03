import type { AccountSwitcherResource } from './en-US.js';

const jaJP: AccountSwitcherResource = {
  menu: {
    switchAccount: 'アカウントを切り替え',
    search: '名前またはメールアドレスで検索',
    loading: 'アカウントを読み込み中…',
    empty: '一致するアカウントはありません',
    more: 'ほかに {{count}} 件あります。検索して絞り込んでください。',
    loadFailed: 'アカウントを読み込めません。',
  },
  banner: {
    actingAs: '{{name}} として操作中',
    description: '変更はこのアカウントの操作として記録されます。',
    return: '{{name}} に戻る',
  },
  errors: {
    switchFailed: 'アカウントを切り替えられません。もう一度お試しください。',
    returnFailed: 'ご自身のアカウントに戻れません。もう一度お試しください。',
  },
};

export default jaJP;
