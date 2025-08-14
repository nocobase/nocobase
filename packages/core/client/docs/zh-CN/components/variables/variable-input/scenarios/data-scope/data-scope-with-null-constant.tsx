/**
 * defaultShowCode: false
 * title: 数据范围场景（支持 Null 和 Constant）
 */

import React from 'react';
import { Application, Plugin, FilterGroup, transformFilter } from '@nocobase/client';
import { observer } from '@formily/reactive-react';
import { observable } from '@formily/reactive';
import { Card, Select, Space, Divider, Typography, Input } from 'antd';
import { FlowContext, VariableInput, MetaTreeNode, Converters } from '@nocobase/flow-engine';

// 数据范围场景的 FilterItem：
// - 左侧：VariableInput（showValueComponent=false）选择上下文变量
// - 中间：操作符（根据左侧变量类型动态调整）
// - 右侧：VariableInput（默认 showValueComponent），支持变量、Null 和 Constant 选项
const DataScopeFilterItem = observer(
  ({ value }: { value: { leftValue: string; operator: string; rightValue: any } }) => {
    const flowContext = React.useMemo(() => {
      const ctx = new FlowContext();
      ctx.defineProperty('user', {
        value: { id: 1, name: 'Alice', email: 'alice@example.com', age: 30, active: true },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            id: { title: 'ID', type: 'number' },
            name: { title: 'Name', type: 'string' },
            email: { title: 'Email', type: 'string' },
            age: { title: 'Age', type: 'number' },
            active: { title: 'Active', type: 'boolean' },
          },
        },
      });
      ctx.defineProperty('org', {
        value: { id: 9, title: 'Sales', type: 'department' },
        meta: {
          title: 'Organization',
          type: 'object',
          properties: {
            id: { title: 'ID', type: 'number' },
            title: { title: 'Title', type: 'string' },
            type: { title: 'Type', type: 'string' },
          },
        },
      });
      return ctx;
    }, []);

    const [leftMeta, setLeftMeta] = React.useState<MetaTreeNode | null>(null);

    // 根据左侧变量类型动态生成操作符选项
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
      return [{ label: t('等于'), value: '$eq' }, { label: t('不等于'), value: '$ne' }, ...commonEmpty];
    }, [leftMeta]);

    // 右侧 VariableInput 的 metaTree：添加 Null 和 Constant 选项
    const getRightMetaTree = React.useCallback(() => {
      const baseMetaTree = flowContext.getPropertyMetaTree();

      // 添加 Null 选项
      baseMetaTree.splice(0, 0, {
        name: 'Null',
        title: 'Null',
        type: 'null',
        paths: ['Null'],
        render: () => <span style={{ color: '#999' }}>null</span>,
      });

      // 添加 Constant 选项
      baseMetaTree.splice(0, 0, {
        name: 'Constant',
        title: 'Constant',
        type: 'string',
        paths: ['Constant'],
        render: () => <Input placeholder="输入常量值" />,
      });

      return baseMetaTree;
    }, [flowContext]);

    // 右侧 VariableInput 的 converters
    const rightConverters: Converters = React.useMemo(
      () => ({
        resolveValueFromPath: (item) => {
          if (item?.paths[0] === 'Constant') return '';
          if (item?.paths[0] === 'Null') return null;
          return undefined;
        },
      }),
      [],
    );

    return (
      <Space size={8}>
        {/* 左侧：变量选择器（按钮形态） */}
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

        {/* 右侧：VariableInput（支持变量、Null、Constant） */}
        <VariableInput
          value={value.rightValue}
          onChange={(v) => (value.rightValue = v)}
          metaTree={getRightMetaTree}
          converters={rightConverters}
          style={{ width: 280 }}
        />
      </Space>
    );
  },
);

const { Text } = Typography;

class PluginDataScopeDemo extends Plugin {
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
            <Card size="small" title="数据范围场景：支持 Null 和 Constant 选项">
              <FilterGroup value={filter as any} FilterItem={DataScopeFilterItem as any} />
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
  plugins: [PluginDataScopeDemo],
});

export default app.getRootComponent();
