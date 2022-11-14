import { i18n } from '@nocobase/client';
import { NAMESPACE } from './constants';
import { enUS, zhCN } from './locale';

i18n.addResources('zh-CN', NAMESPACE, zhCN);
i18n.addResources('en-US', NAMESPACE, enUS);

export * from './ImportActionInitializer';
export * from './ImportDesigner';
export * from './ImportInitializerProvider';
export * from './ImportPluginProvider';
export { ImportPluginProvider as default } from './ImportPluginProvider';
export * from './useImportAction';
