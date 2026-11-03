import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  errors: {
    logsForbidden: 'Cần có quyền truy cập vào nhật ký thông báo.',
    logNotFound: 'Không tìm thấy nhật ký thông báo.',
  },
};

export default viVN;
