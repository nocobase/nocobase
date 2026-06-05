/**
 * defaultShowCode: false
 * title: 自定义 FilterItem
 */

import React from 'react';
import { Application, Plugin, FilterGroup } from '@nocobase/client';
import { observer } from '@formily/reactive-react';
import { observable } from '@formily/reactive';
import { Card, DatePicker, Input, Select, Space } from 'antd';

// 一个示例性的自定义 FilterItem：
// - 根据 operator 渲染不同的右侧输入组件（文本/日期）
// - 简单演示如何扩展交互
const MyFilterItem = observer(({ value }: { value: { leftValue: string; operator: string; rightValue: any } }) => {
  return (
    <Space size={8}>
      <Input
        placeholder="字段名，如 createdAt"
        style={{ width: 160 }}
        value={value.leftValue}
        onChange={(e) => (value.leftValue = e.target.value)}
      />

      <Select
        style={{ width: 160 }}
        value={value.operator}
        onChange={(v) => (value.operator = v as any)}
        options={[
          { label: '等于($eq)', value: '$eq' },
          { label: '不等于($ne)', value: '$ne' },
          { label: '大于($gt)', value: '$gt' },
          { label: '小于($lt)', value: '$lt' },
          { label: '日期等于($dateEq)', value: '$dateEq' },
        ]}
      />

      {value.operator === '$dateEq' ? (
        <DatePicker style={{ width: 180 }} onChange={(_, str) => (value.rightValue = str)} />
      ) : (
        <Input
          placeholder="值"
          style={{ width: 180 }}
          value={value.rightValue}
          onChange={(e) => (value.rightValue = e.target.value)}
        />
      )}
    </Space>
  );
});

class PluginCustomFilterItemDemo extends Plugin {
  async load() {
    const Demo = observer(() => {
      const filter = React.useMemo(
        () =>
          observable({
            logic: '$and',
            items: [
              { leftValue: 'createdAt', operator: '$dateEq', rightValue: '' },
              { leftValue: 'status', operator: '$eq', rightValue: 'active' },
            ],
          }),
        [],
      );

      return (
        <div style={{ padding: 16 }}>
          <Card size="small" title="使用自定义 FilterItem">
            <FilterGroup value={filter as any} FilterItem={MyFilterItem} />
          </Card>
        </div>
      );
    });

    this.router.add('root', { path: '/', element: <Demo /> });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [PluginCustomFilterItemDemo],
});

export default app.getRootComponent();
