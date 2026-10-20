import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: '通知ログへのアクセスが必要です。',
    logNotFound: '通知ログが見つかりません。',
    testHeaderRequired: '通知テストリクエストヘッダーは必須です。',
    testForbidden: '通知テスト送信許可が必要です。',
    testInvalidRequest:
      'リクエストボディにはテストターゲットとフィールド値が含まれている必要があります。',
    testTargetUnavailable: '通知テスト対象が利用できません。',
    testUnknownField: '不明な通知テストフィールド「{{name}}」。',
    testRequiredField: '通知テストフィールド「{{name}}」は必須です。',
    testFieldTooLong:
      '通知テストフィールド「{{name}}」は最大でも{{maxLength}}文字でなければなりません。',
    testFailed: '通知テストに失敗しました。',
    testNotFound: '通知テストが見つかりませんでした。',
  },
};

export default jaJP;
