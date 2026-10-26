import type { LocaleResource } from '@nocobase/i18n';

// The application's own server-side wording. It is empty because every string the server produces today belongs to a
// plugin's namespace; add keys here as the application starts producing its own, and use `overrides` to reword a
// plugin's.
const enUS = {};

export type AppServerResource = LocaleResource<typeof enUS>;

export default enUS;
