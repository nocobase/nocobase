import {
  CollectionManagerContext,
  CurrentAppInfoProvider,
  SchemaComponentOptions,
  SchemaInitializerContext,
  SchemaInitializerProvider,
  SettingsCenterProvider,
} from '@nocobase/client';
import React, { useContext } from 'react';
import Configuration from './components/Configuration';
import { useCustomRequestTranslation } from './locale';
import './locale';
import { CustomRequest } from './CustomRequest';
import { CustomRequestInitializer } from './CustomRequestInitializer';

export default React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  const { t } = useCustomRequestTranslation();
  const items = useContext(SchemaInitializerContext);
  const children = items.BlockInitializers.items[0].children;
  if (children) {
    const hasChartItem = children.some((child) => child?.component === 'CustomRequestInitializer');
    if (!hasChartItem) {
      children.push({
        key: 'custom-request',
        type: 'item',
        icon: 'PieChartOutlined',
        title: '{{t("Custom request")}}',
        component: 'CustomRequestInitializer',
      });
    }
  }
  return (
    <SchemaInitializerProvider initializers={{ CustomRequestInitializer }}>
      <CurrentAppInfoProvider>
        <SettingsCenterProvider
          settings={{
            customRequest: {
              title: t('Custom request'),
              icon: 'EnvironmentOutlined',
              tabs: {
                configuration: {
                  title: t('Configuration'),
                  component: Configuration,
                },
              },
            },
          }}
        >
          <SchemaComponentOptions components={{ CustomRequest }}>
            <CollectionManagerContext.Provider value={{ ...ctx, interfaces: { ...ctx.interfaces } }}>
              {props.children}
            </CollectionManagerContext.Provider>
          </SchemaComponentOptions>
        </SettingsCenterProvider>
      </CurrentAppInfoProvider>
    </SchemaInitializerProvider>
  );
});
