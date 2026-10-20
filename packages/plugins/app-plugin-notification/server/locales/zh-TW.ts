import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: '需要存取通知日誌。',
    logNotFound: '未找到通知日誌。',
    testHeaderRequired: '通知測試請求標頭是必要的。',
    testForbidden: '需要通知測試傳送許可權。',
    testInvalidRequest: '請求正文必須包含測試目標和欄位值。',
    testTargetUnavailable: '通知測試目標不可用。',
    testUnknownField: '未知通知測試欄位「{{name}}」。',
    testRequiredField: '通知測試欄位「{{name}}」為必填項。',
    testFieldTooLong:
      '通知測試欄位「{{name}}」最多隻能是 {{maxLength}} 個字元。',
    testFailed: '通知測試失敗。',
    testNotFound: '未找到通知測試。',
  },
};

export default zhTW;
