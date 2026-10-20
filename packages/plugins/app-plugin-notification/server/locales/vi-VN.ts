import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'Cần có quyền truy cập vào nhật ký thông báo.',
    logNotFound: 'Không tìm thấy nhật ký thông báo.',
    testHeaderRequired: 'Cần có tiêu đề yêu cầu kiểm tra thông báo.',
    testForbidden: 'Cần có quyền gửi kiểm tra thông báo.',
    testInvalidRequest:
      'Nội dung yêu cầu phải chứa mục tiêu thử nghiệm và giá trị trường.',
    testTargetUnavailable: 'Mục tiêu kiểm tra thông báo không khả dụng.',
    testUnknownField: 'Trường kiểm tra thông báo không xác định "{{name}}".',
    testRequiredField: 'Trường kiểm tra thông báo "{{name}}" là bắt buộc.',
    testFieldTooLong:
      'Trường kiểm tra thông báo "{{name}}" phải có tối đa {{maxLength}} ký tự.',
    testFailed: 'Kiểm tra thông báo không thành công.',
    testNotFound: 'Không tìm thấy kiểm tra thông báo.',
  },
};

export default viVN;
