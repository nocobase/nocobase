import { SchemaInitializerItemTypeWithoutName, usePlugin } from '@nocobase/client';
import PluginBlockTemplateClient from '..';
import { TemplateBlockInitializer } from './TemplateBlockInitializer';

export const templateBlockInitializerItem: SchemaInitializerItemTypeWithoutName = {
  name: 'templates',
  Component: TemplateBlockInitializer,
  title: '{{t("Templates")}}',
  icon: 'TableOutlined',
  sort: -1,
  wrap: (t) => t,
  useVisible: () => {
    const plugin = usePlugin(PluginBlockTemplateClient);
    return plugin && !plugin?.isInBlockTemplateConfigPage();
  },
};
