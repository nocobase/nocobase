/**
 * defaultShowCode: false
 * title: 右侧输入根据左值类型动态渲染
 */

import React from 'react';
import { Application, Plugin, FilterGroup, transformFilter } from '@nocobase/client';
import { observer } from '@formily/reactive-react';
import { observable } from '@formily/reactive';
import { Card, DatePicker, Input, InputNumber, Select, Space } from 'antd';
import { FlowContext, VariableInput, MetaTreeNode } from '@nocobase/flow-engine';

// 根据左值的类型动态渲染右侧输入组件，并动态提供操作符
const DynamicRightFilterItem = observer(
  ({ value }: { value: { leftValue: string; operator: string; rightValue: any } }) => {
    const flowContext = React.useMemo(() => {
      const ctx = new FlowContext();
      ctx.defineProperty('user', {
        value: { id: 1, name: 'Alice', age: 20, active: true, createdAt: '2024-07-01' },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            name: { title: 'Name', type: 'string' },
            age: { title: 'Age', type: 'number' },
            active: { title: 'Active', type: 'boolean' },
            createdAt: { title: 'Created At', type: 'date' },
          },
        },
      });
      ctx.defineProperty('org', {
        value: { title: 'Sales' },
        meta: { title: 'Org', type: 'object', properties: { title: { title: 'Title', type: 'string' } } },
      });
      return ctx;
    }, []);

    const [leftMeta, setLeftMeta] = React.useState<MetaTreeNode | null>(null);

    const operatorOptions = React.useMemo(() => {
      const t = (s: string) => s;
      const type = leftMeta?.type;
      const commonEmpty = [
        { label: t('为空'), value: '$empty' },
        { label: t('非空'), value: '$notEmpty' },
      ];
      if (type === 'string') {
        return [
          { label: t('等于'), value: '$eq' },
          { label: t('不等于'), value: '$ne' },
          { label: t('包含'), value: '$includes' },
          { label: t('开头是'), value: '$startsWith' },
          { label: t('结尾是'), value: '$endsWith' },
          ...commonEmpty,
        ];
      }
      if (type === 'number') {
        return [
          { label: t('等于'), value: '$eq' },
          { label: t('不等于'), value: '$ne' },
          { label: t('大于'), value: '$gt' },
          { label: t('大于等于'), value: '$gte' },
          { label: t('小于'), value: '$lt' },
          { label: t('小于等于'), value: '$lte' },
          ...commonEmpty,
        ];
      }
      if (type === 'boolean') {
        return [
          { label: t('等于'), value: '$eq' },
          { label: t('不等于'), value: '$ne' },
        ];
      }
      if (type === 'date' || type === 'datetime') {
        return [
          { label: t('等于'), value: '$eq' },
          { label: t('不等于'), value: '$ne' },
          { label: t('晚于'), value: '$gt' },
          { label: t('晚于等于'), value: '$gte' },
          { label: t('早于'), value: '$lt' },
          { label: t('早于等于'), value: '$lte' },
          ...commonEmpty,
        ];
      }
      return [{ label: t('等于'), value: '$eq' }, { label: t('不等于'), value: '$ne' }, ...commonEmpty];
    }, [leftMeta]);

    const isRightInputDisabled = value.operator === '$empty' || value.operator === '$notEmpty';

    const RightInput = React.useMemo(() => {
      const type = leftMeta?.type;
      if (type === 'number') return 'number';
      if (type === 'boolean') return 'boolean';
      if (type === 'date' || type === 'datetime') return 'date';
      return 'string';
    }, [leftMeta]);

    return (
      <Space size={8}>
        {/* 左侧变量选择器 */}
        <VariableInput
          value={value.leftValue}
          onChange={(variableValue: string, meta?: MetaTreeNode) => {
            value.leftValue = variableValue;
            setLeftMeta(meta || null);
            // 左值变化时，重置 operator 与 rightValue
            const nextOp = (operatorOptions && operatorOptions[0]?.value) || '';
            value.operator = nextOp as any;
            value.rightValue = '';
          }}
          metaTree={() => flowContext.getPropertyMetaTree()}
          showValueComponent={false}
        />

        {/* 操作符 */}
        <Select
          style={{ width: 160 }}
          value={value.operator || undefined}
          onChange={(v) => (value.operator = v as any)}
          options={operatorOptions}
          placeholder="选择操作符"
          disabled={!value.leftValue}
        />

        {/* 右侧输入：根据左值类型渲染 */}
        {RightInput === 'number' ? (
          <InputNumber
            style={{ width: 200 }}
            value={typeof value.rightValue === 'number' ? value.rightValue : undefined}
            onChange={(num) => (value.rightValue = num)}
            disabled={!value.leftValue || !value.operator || isRightInputDisabled}
          />
        ) : RightInput === 'boolean' ? (
          <Select
            style={{ width: 200 }}
            value={value.rightValue}
            onChange={(v) => (value.rightValue = v)}
            options={[
              { label: 'true', value: true },
              { label: 'false', value: false },
            ]}
            disabled={!value.leftValue || !value.operator || isRightInputDisabled}
          />
        ) : RightInput === 'date' ? (
          <DatePicker
            style={{ width: 200 }}
            onChange={(_, str) => (value.rightValue = str)}
            disabled={!value.leftValue || !value.operator || isRightInputDisabled}
          />
        ) : (
          <Input
            placeholder="值"
            style={{ width: 200 }}
            value={value.rightValue}
            onChange={(e) => (value.rightValue = e.target.value)}
            disabled={!value.leftValue || !value.operator || isRightInputDisabled}
          />
        )}
      </Space>
    );
  },
);

class PluginDynamicRightDemo extends Plugin {
  async load() {
    const Demo = observer(() => {
      const filter = React.useMemo(
        () =>
          observable({
            logic: '$and',
            items: [{ leftValue: '', operator: '', rightValue: '' }],
          }),
        [],
      );

      const queryObject = transformFilter(filter as any);

      return (
        <div style={{ padding: 16 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small" title="自定义 FilterItem：右侧输入根据左值类型动态渲染">
              <FilterGroup value={filter as any} FilterItem={DynamicRightFilterItem as any} />
            </Card>

            <Card size="small" title="转换后的查询对象（transformFilter）">
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
  plugins: [PluginDynamicRightDemo],
});

export default app.getRootComponent();
