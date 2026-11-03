import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';

import metadata from '../package.json' with { type: 'json' };
import locales from './locales/index.js';

const readingList: AppClientPluginFactory = defineClientPlugin({
  packageName: metadata.name,
  locales,
});

export default readingList;
export { ReadingList } from './reading-list.js';
export { readingListPageSize } from './public-config.js';
