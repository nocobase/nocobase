import { TableOutlined } from '@ant-design/icons';
import {
  Plugin,
  SchemaComponentOptions,
  SchemaInitializer,
  SchemaInitializerContext,
  SettingsCenterProvider,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { HelloDesigner } from './HelloDesigner';
import SampleDisplay from './SampleDisplay';

export const HelloBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-designer': 'HelloDesigner',
          properties: {
            // hello: {
            //   type: 'void',
            //   'x-component': 'div',
            //   'x-content': 'Hello World',
            // },
            customHello: {
              type: 'void',
              'x-component': 'CardItem',
              'x-content': 'custom hello world',
            },
          },
        });
      }}
      title={t('Hello block')}
    />
  );
};

const HelloProvider = React.memo((props) => {
  const items = useContext<any>(SchemaInitializerContext);
  const mediaItems = items.BlockInitializers.items.find((item) => item.key === 'media');

  if (process.env.NODE_ENV !== 'production' && !mediaItems) {
    throw new Error('media block initializer not found');
  }

  const children = mediaItems.children;
  if (!children.find((item) => item.key === 'hello')) {
    children.push({
      key: 'hello',
      type: 'item',
      title: '{{t("Hello block")}}',
      component: 'HelloBlockInitializer',
    });
  }

  return (
    <SettingsCenterProvider
      settings={{
        'sample-hello': {
          title: 'Hello',
          icon: 'ApiOutlined',
          tabs: {
            tab1: {
              title: 'Hello tab',
              component: () => <SampleDisplay />,
            },
          
          },
        },
      }}
    >
      <SchemaComponentOptions components={{ HelloDesigner, HelloBlockInitializer }}>
        {/* This renders the UI */}
        <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>
      </SchemaComponentOptions>
    </SettingsCenterProvider>
  );
});
HelloProvider.displayName = 'HelloProvider';

class HelloPlugin extends Plugin {
  async load() {
    this.app.addProvider(HelloProvider);
  }
}

export default HelloPlugin;
