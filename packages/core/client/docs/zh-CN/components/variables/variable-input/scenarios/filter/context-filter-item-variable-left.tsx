/**
 * defaultShowCode: false
 * title: 变量作为左值（VariableInput on left）
 */

import React from 'react';
import { Application, Plugin, FilterGroup, transformFilter } from '@nocobase/client';
import { observer } from '@formily/reactive-react';
import { observable } from '@formily/reactive';
import { Card, Input, Select, Space } from 'antd';
import { FlowContext, VariableInput, MetaTreeNode } from '@nocobase/flow-engine';

// 一个示例性的“变量作为左值”的 FilterItem：
// - 左侧使用 VariableInput（showValueComponent=false）选择上下文变量
// - 中间为操作符选择（静态集合）
// - 右侧为可替换的输入组件（此处用 Input）
const VariableLeftFilterItem = observer(
  ({ value }: { value: { leftValue: string; operator: string; rightValue: any } }) => {
    const flowContext = React.useMemo(() => {
      const ctx = new FlowContext();
      // 简单模拟上下文结构
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

    return (
      <Space size={8}>
        {/* 左侧：VariableInput，仅显示选择器按钮 */}
        <VariableInput
          value={value.leftValue}
          onChange={(variableValue: string, meta?: MetaTreeNode) => {
            value.leftValue = variableValue;
            setLeftMeta(meta || null);
            // 重置 operator & rightValue
            value.operator = operatorOptions?.[0]?.value || '';
            value.rightValue = '';
          }}
          metaTree={() => flowContext.getPropertyMetaTree()}
          showValueComponent={false}
        />

        {/* 中间：操作符 */}
        <Select
          style={{ width: 160 }}
          value={value.operator || undefined}
          onChange={(v) => (value.operator = v as any)}
          options={operatorOptions}
          placeholder="选择操作符"
          disabled={!value.leftValue}
        />

        {/* 右侧：值（可替换为不同组件） */}
        <Input
          placeholder="值"
          style={{ width: 200 }}
          value={value.rightValue}
          onChange={(e) => (value.rightValue = e.target.value)}
          disabled={!value.leftValue || !value.operator}
        />
      </Space>
    );
  },
);

class PluginVariableLeftDemo extends Plugin {
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
            <Card size="small" title="自定义 FilterItem：变量作为左值">
              <FilterGroup value={filter as any} FilterItem={VariableLeftFilterItem as any} />
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
  plugins: [PluginVariableLeftDemo],
});

export default app.getRootComponent();
