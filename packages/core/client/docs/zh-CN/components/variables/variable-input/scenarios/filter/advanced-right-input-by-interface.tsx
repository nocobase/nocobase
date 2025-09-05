/**
 * defaultShowCode: false
 * title: 右侧输入根据 interface/uiSchema 渲染（进阶）
 */

import React from 'react';
import { Application, Plugin, FilterGroup, transformFilter } from '@nocobase/client';
import { observer } from '@formily/reactive-react';
import { observable } from '@formily/reactive';
import { Card, DatePicker, Input, InputNumber, Select, Space } from 'antd';
import { FlowContext, VariableInput, MetaTreeNode } from '@nocobase/flow-engine';

// 读取 uiSchema.enum，兼容 ['A','B'] 或 [{label,value}]
function getEnumOptions(uiSchema?: any): { label: string; value: any }[] | undefined {
  const list = uiSchema?.enum;
  if (!Array.isArray(list)) return undefined;
  if (list.length === 0) return [];
  if (typeof list[0] === 'object') return list as any;
  return (list as any[]).map((v) => ({ label: String(v), value: v }));
}

// 根据 interface/uiSchema 推断右侧输入类型
function deriveRightInput(
  meta?: MetaTreeNode | null,
):
  | { type: 'select'; options: { label: string; value: any }[] }
  | { type: 'boolean' }
  | { type: 'date' }
  | { type: 'daterange' }
  | { type: 'number' }
  | { type: 'textarea' }
  | { type: 'string' } {
  if (!meta) return { type: 'string' };
  const inf = meta.interface;
  const ui = meta.uiSchema || {};
  const xComp = ui['x-component'];

  // boolean
  if (inf === 'boolean' || xComp === 'Switch' || xComp === 'Checkbox') {
    return { type: 'boolean' };
  }

  // number
  if (inf === 'number' || xComp === 'InputNumber') {
    return { type: 'number' };
  }

  // date / datetime / range
  if (inf === 'date' || inf === 'datetime' || xComp === 'DatePicker') {
    return { type: 'date' };
  }
  if (xComp === 'DatePicker.RangePicker') {
    return { type: 'daterange' };
  }

  // select / radio / enum
  const enumOptions = getEnumOptions(ui);
  if (inf === 'select' || xComp === 'Select' || xComp === 'Radio.Group' || (enumOptions && enumOptions.length >= 0)) {
    return { type: 'select', options: enumOptions || [] };
  }

  // 文本域
  if (xComp === 'Input.TextArea') {
    return { type: 'textarea' };
  }

  // 默认
  return { type: 'string' };
}

// 按 interface/uiSchema 提供操作符集合（可自行扩展）
function getOperatorOptionsByMeta(meta?: MetaTreeNode | null) {
  const t = (s: string) => s;
  const inputKind = deriveRightInput(meta).type;
  const commonEmpty = [
    { label: t('为空'), value: '$empty' },
    { label: t('非空'), value: '$notEmpty' },
  ];
  if (inputKind === 'boolean') {
    return [
      { label: t('等于'), value: '$eq' },
      { label: t('不等于'), value: '$ne' },
    ];
  }
  if (inputKind === 'number' || inputKind === 'date' || inputKind === 'daterange') {
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
  if (inputKind === 'select') {
    return [{ label: t('等于'), value: '$eq' }, { label: t('不等于'), value: '$ne' }, ...commonEmpty];
  }
  if (inputKind === 'textarea' || inputKind === 'string') {
    return [
      { label: t('等于'), value: '$eq' },
      { label: t('不等于'), value: '$ne' },
      { label: t('包含'), value: '$includes' },
      { label: t('开头是'), value: '$startsWith' },
      { label: t('结尾是'), value: '$endsWith' },
      ...commonEmpty,
    ];
  }
  return [{ label: t('等于'), value: '$eq' }, { label: t('不等于'), value: '$ne' }, ...commonEmpty];
}

const AdvancedRightFilterItem = observer(
  ({ value }: { value: { leftValue: string; operator: string; rightValue: any } }) => {
    const flowContext = React.useMemo(() => {
      const ctx = new FlowContext();

      // 模拟多类型字段，带 interface 和 uiSchema
      ctx.defineProperty('record', {
        value: {
          title: 'Hello',
          category: 'news',
          score: 80,
          published: true,
          publishedAt: '2024-07-01',
          range: ['2024-01-01', '2024-12-31'],
          description: 'Long text',
        },
        meta: {
          title: 'Record',
          type: 'object',
          properties: {
            title: { title: 'Title', type: 'string', interface: 'input', uiSchema: { 'x-component': 'Input' } },
            category: {
              title: 'Category',
              type: 'string',
              interface: 'select',
              uiSchema: {
                'x-component': 'Select',
                enum: [
                  { label: 'News', value: 'news' },
                  { label: 'Blog', value: 'blog' },
                  { label: 'Doc', value: 'doc' },
                ],
              },
            },
            score: { title: 'Score', type: 'number', interface: 'number', uiSchema: { 'x-component': 'InputNumber' } },
            published: {
              title: 'Published',
              type: 'boolean',
              interface: 'boolean',
              uiSchema: { 'x-component': 'Switch' },
            },
            publishedAt: {
              title: 'Published At',
              type: 'date',
              interface: 'date',
              uiSchema: { 'x-component': 'DatePicker' },
            },
            range: {
              title: 'Range',
              type: 'string',
              interface: 'daterange',
              uiSchema: { 'x-component': 'DatePicker.RangePicker' },
            },
            description: {
              title: 'Description',
              type: 'string',
              interface: 'textarea',
              uiSchema: { 'x-component': 'Input.TextArea' },
            },
          },
        },
      });

      return ctx;
    }, []);

    const [leftMeta, setLeftMeta] = React.useState<MetaTreeNode | null>(null);

    const operatorOptions = React.useMemo(() => getOperatorOptionsByMeta(leftMeta), [leftMeta]);
    const inputSpec = React.useMemo(() => deriveRightInput(leftMeta), [leftMeta]);
    const disableRight = value.operator === '$empty' || value.operator === '$notEmpty';

    return (
      <Space size={8}>
        {/* 左侧：VariableInput */}
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
          style={{ width: 170 }}
          value={value.operator || undefined}
          onChange={(v) => (value.operator = v as any)}
          options={operatorOptions}
          placeholder="选择操作符"
          disabled={!value.leftValue}
        />

        {/* 右侧输入：根据 interface/uiSchema 渲染 */}
        {inputSpec.type === 'boolean' ? (
          <Select
            style={{ width: 220 }}
            value={value.rightValue}
            onChange={(v) => (value.rightValue = v)}
            options={[
              { label: 'true', value: true },
              { label: 'false', value: false },
            ]}
            disabled={!value.leftValue || !value.operator || disableRight}
          />
        ) : inputSpec.type === 'number' ? (
          <InputNumber
            style={{ width: 220 }}
            value={typeof value.rightValue === 'number' ? value.rightValue : undefined}
            onChange={(num) => (value.rightValue = num)}
            disabled={!value.leftValue || !value.operator || disableRight}
          />
        ) : inputSpec.type === 'date' ? (
          <DatePicker
            style={{ width: 220 }}
            onChange={(_, str) => (value.rightValue = str)}
            disabled={!value.leftValue || !value.operator || disableRight}
          />
        ) : inputSpec.type === 'daterange' ? (
          <DatePicker.RangePicker
            style={{ width: 320 }}
            onChange={(_, str) => (value.rightValue = str)}
            disabled={!value.leftValue || !value.operator || disableRight}
          />
        ) : inputSpec.type === 'select' ? (
          <Select
            style={{ width: 220 }}
            value={value.rightValue}
            onChange={(v) => (value.rightValue = v)}
            options={inputSpec.options}
            disabled={!value.leftValue || !value.operator || disableRight}
          />
        ) : inputSpec.type === 'textarea' ? (
          <Input.TextArea
            style={{ width: 320 }}
            autoSize={{ minRows: 1, maxRows: 3 }}
            value={value.rightValue}
            onChange={(e) => (value.rightValue = e.target.value)}
            disabled={!value.leftValue || !value.operator || disableRight}
          />
        ) : (
          <Input
            placeholder="值"
            style={{ width: 220 }}
            value={value.rightValue}
            onChange={(e) => (value.rightValue = e.target.value)}
            disabled={!value.leftValue || !value.operator || disableRight}
          />
        )}
      </Space>
    );
  },
);

class PluginAdvancedRightDemo extends Plugin {
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
            <Card size="small" title="自定义 FilterItem：右侧输入根据 interface/uiSchema 渲染（进阶）">
              <FilterGroup value={filter as any} FilterItem={AdvancedRightFilterItem as any} />
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
  plugins: [PluginAdvancedRightDemo],
});

export default app.getRootComponent();
