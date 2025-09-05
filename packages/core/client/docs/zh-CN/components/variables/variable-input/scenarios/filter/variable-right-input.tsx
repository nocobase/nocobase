/**
 * defaultShowCode: false
 * title: 右侧为 VariableInput（支持变量或静态值）
 */

import React from 'react';
import { Application, Plugin, FilterGroup, transformFilter } from '@nocobase/client';
import { observer } from '@formily/reactive-react';
import { observable } from '@formily/reactive';
import { Card, Select, Space, Divider, Typography } from 'antd';
import { FlowContext, VariableInput, MetaTreeNode } from '@nocobase/flow-engine';

// 右侧显示 VariableInput（showValueComponent=true），可选择变量或输入静态值
// - 左侧：VariableInput（showValueComponent=false）选择上下文变量
// - 中间：操作符
// - 右侧：VariableInput（showValueComponent=true），metaTree 动态依赖左侧值
const VariableRightFilterItem = observer(
  ({ value }: { value: { leftValue: string; operator: string; rightValue: any } }) => {
    const flowContext = React.useMemo(() => {
      const ctx = new FlowContext();
      ctx.defineProperty('user', {
        value: { id: 1, name: 'Alice', email: 'alice@example.com' },
        meta: {
          title: 'User',
          type: 'object',
          properties: {
            id: { title: 'ID', type: 'number' },
            name: { title: 'Name', type: 'string' },
            email: { title: 'Email', type: 'string' },
          },
        },
      });
      ctx.defineProperty('org', {
        value: { id: 9, title: 'Sales' },
        meta: {
          title: 'Org',
          type: 'object',
          properties: { id: { title: 'ID', type: 'number' }, title: { title: 'Title', type: 'string' } },
        },
      });
      ctx.defineProperty('now', {
        value: new Date().toISOString(),
        meta: { title: 'Now', type: 'string' },
      });
      return ctx;
    }, []);

    const [leftMeta, setLeftMeta] = React.useState<MetaTreeNode | null>(null);
    const operatorOptions = React.useMemo(
      () => [
        { label: '等于', value: '$eq' },
        { label: '不等于', value: '$ne' },
        { label: '包含', value: '$includes' },
      ],
      [],
    );

    // 右侧 VariableInput 的 metaTree：
    // - 若左侧已选择变量，则取其对应子树（例如选择 {{ ctx.user }}，右侧就建议从 user 的字段中选）
    // - 否则提供整个 ctx 的 metaTree
    const rightMetaTree = React.useCallback(() => {
      if (value.leftValue) {
        // 传入左侧变量表达式，获取子树
        return flowContext.getPropertyMetaTree(value.leftValue);
      }
      return flowContext.getPropertyMetaTree();
    }, [flowContext, value.leftValue]);

    return (
      <Space size={8}>
        {/* 左侧：变量选择器（按钮形态） */}
        <VariableInput
          value={value.leftValue}
          onChange={(variableValue: string, meta?: MetaTreeNode) => {
            value.leftValue = variableValue;
            setLeftMeta(meta || null);
            value.operator = operatorOptions?.[0]?.value || '';
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

        {/* 右侧：VariableInput（可输入静态值或选择变量） */}
        <VariableInput
          value={value.rightValue}
          onChange={(v) => (value.rightValue = v)}
          metaTree={rightMetaTree}
          showValueComponent={true}
          style={{ width: 260 }}
        />
      </Space>
    );
  },
);

const { Text } = Typography;

class PluginVariableRightDemo extends Plugin {
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
            <Card size="small" title="自定义 FilterItem：右侧为 VariableInput（变量或静态值）">
              <FilterGroup value={filter as any} FilterItem={VariableRightFilterItem as any} />
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
  plugins: [PluginVariableRightDemo],
});

export default app.getRootComponent();
