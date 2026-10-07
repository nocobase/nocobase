import type { LocaleResource } from '@nocobase/i18n';

import accessEnUS from '../../shared/locales/access.en-US.js';

const enUS: typeof accessEnUS = accessEnUS;

export type ReleasesResource = LocaleResource<typeof enUS>;

export default enUS;
