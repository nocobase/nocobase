import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  title: 'Reading list',
  loading: 'Loading entries…',
  failed: 'The reading list could not be loaded.',
  empty: 'No entries yet.',
};

export type ReadingListResource = LocaleResource<typeof enUS>;
export default enUS;
