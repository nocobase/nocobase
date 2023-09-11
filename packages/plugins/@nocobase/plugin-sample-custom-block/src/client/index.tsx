import { TableOutlined } from '@ant-design/icons';
import { Plugin, SchemaInitializer, SchemaInitializerContext } from '@nocobase/client';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { HelloDesigner } from './HelloDesigner';

export const HelloBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<TableOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-component': 'CardItem',
          'x-designer': 'HelloDesigner',
          properties: {
            hello: {
              type: 'void',
              'x-component': 'div',
              'x-content': 'Hello World',
            },
          },
        });
      }}
      title={t('Hello block')}
    />
  );
};

const CustomBlockProvider = React.memo((props) => {
  const items = useContext<any>(SchemaInitializerContext);
  const children = items.BlockInitializers.items[2].children;
  children.push({
    key: 'customBlock',
    type: 'item',
    title: '{{t("Hello block")}}',
    component: 'HelloBlockInitializer',
  });
  return <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>;
});
CustomBlockProvider.displayName = 'CustomBlockProvider';

class CustomBlockPlugin extends Plugin {
  async load() {
    this.app.addComponents({
      HelloDesigner,
      HelloBlockInitializer,
    });
    this.app.addProvider(CustomBlockProvider);
  }
}

export default CustomBlockPlugin;
