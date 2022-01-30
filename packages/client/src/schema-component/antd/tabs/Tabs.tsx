import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { TabPaneProps, Tabs as AntdTabs, TabsProps } from 'antd';
import React from 'react';

export const Tabs: any = observer((props: TabsProps) => {
  const fieldSchema = useFieldSchema();
  return (
    <div>
      <AntdTabs>
        {fieldSchema.mapProperties((schema, key) => {
          return (
            <AntdTabs.TabPane tab={<RecursionField name={key} schema={schema} onlyRenderSelf />} key={key}>
              <RecursionField name={key} schema={schema} onlyRenderProperties />
            </AntdTabs.TabPane>
          );
        })}
      </AntdTabs>
    </div>
  );
});

Tabs.TabPane = observer((props: TabPaneProps) => {
  const field = useField();
  return <>{props.tab || field.title}</>;
});
