import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const zhTW: LocaleResource<typeof enUS> = {
  demo: {
    preparing: '正在準備示範郵箱…',
    setUp: '準備示範郵箱',
    setupFailed: '無法準備示範郵箱。',
  },
};

export default zhTW;
