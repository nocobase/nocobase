import {PieChartOutlined} from '@ant-design/icons';
import {
  SchemaComponentOptions,
  SchemaInitializer,
  SchemaInitializerContext, SettingsCenterProvider
} from '@nocobase/client';
import {Card} from 'antd';
import React, {useContext} from 'react';
import {useTranslation} from 'react-i18next';
import {ChartBlockInitializer} from "./ChartBlockInitializer";
import {ChartBlockEngine} from "./ChartBlockEngine";

export default React.memo((props) => {
  const items = useContext(SchemaInitializerContext);
  const children = items.BlockInitializers.items[0].children;
  children.push({
    key: 'chart',
    type: 'item',
    title: '{{t("Chart")}}',
    component: 'ChartBlockInitializer',
  });
  return (
    <SettingsCenterProvider
      settings={{
        'charts': {
          title: 'charts',
          icon: 'PieChartOutlined',
          tabs: {
            tab1: {
              title: 'charts tab',
              component: () => <Card bordered={false}>Hello Charts</Card>,
            },
          },
        },
      }}
    >
      <SchemaComponentOptions components={{ChartBlockInitializer,ChartBlockEngine}}>
        <SchemaInitializerContext.Provider value={items}>{props.children}</SchemaInitializerContext.Provider>
      </SchemaComponentOptions>
    </SettingsCenterProvider>
  );
});
