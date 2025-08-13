/**
 * defaultShowCode: true
 * title: 基础用法
 */

import React from 'react';
import { Application, Plugin, FilterGroup, transformFilter } from '@nocobase/client';
import { observer } from '@formily/reactive-react';
import { observable } from '@formily/reactive';
import { Card, Divider, Input, Select, Space, Typography } from 'antd';

const { Text } = Typography;

// 一个最简 FilterItem，直接修改传入的响应式 value
const BasicFilterItem = observer(({ value }: { value: { leftValue: string; operator: string; rightValue: any } }) => {
  return (
    <Space size={8}>
      <Input
        placeholder="字段名，如 name"
        style={{ width: 140 }}
        value={value.leftValue}
        onChange={(e) => (value.leftValue = e.target.value)}
      />
      <Select
        style={{ width: 120 }}
        value={value.operator}
        onChange={(v) => (value.operator = v as any)}
        options={[
          { label: '等于($eq)', value: '$eq' },
          { label: '不等于($ne)', value: '$ne' },
          { label: '大于($gt)', value: '$gt' },
          { label: '小于($lt)', value: '$lt' },
          { label: '包含($includes)', value: '$includes' },
        ]}
      />
      <Input
        placeholder="值，如 John"
        style={{ width: 160 }}
        value={value.rightValue}
        onChange={(e) => (value.rightValue = e.target.value)}
      />
    </Space>
  );
});

class PluginFilterGroupBasic extends Plugin {
  async load() {
    const Demo = observer(() => {
      // 外部维护一个响应式的 FilterGroup 值
      const filter = React.useMemo(
        () =>
          observable({
            logic: '$and',
            items: [
              { leftValue: 'name', operator: '$eq', rightValue: 'John' },
              { leftValue: 'age', operator: '$gt', rightValue: 18 },
            ],
          }),
        [],
      );

      const queryObject = transformFilter(filter as any);

      return (
        <div style={{ padding: 16 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small" title="FilterGroup">
              <FilterGroup value={filter as any} FilterItem={BasicFilterItem} />
            </Card>

            <Card size="small" title="当前值">
              <Text type="secondary">FilterGroup 值（响应式）</Text>
              <pre style={{ marginTop: 8 }}>{JSON.stringify(filter, null, 2)}</pre>

              <Divider style={{ margin: '12px 0' }} />

              <Text type="secondary">转换后的查询对象（transformFilter）</Text>
              <pre style={{ marginTop: 8 }}>{JSON.stringify(queryObject, null, 2)}</pre>
            </Card>
          </Space>
        </div>
      );
    });

    this.router.add('root', { path: '/', element: <Demo /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginFilterGroupBasic],
});

export default app.getRootComponent();
