import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const jaJP: LocaleResource<typeof enUS> = {
  demo: {
    preparing: 'デモ用メールボックスを準備しています…',
    setUp: 'デモ用メールボックスを準備',
    setupFailed: 'デモ用メールボックスを準備できませんでした。',
  },
};

export default jaJP;
