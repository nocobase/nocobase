import { Button, Card, Table, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { FilterFlowManager } from '@nocobase/client';

// 创建FilterFlowManager实例
const filterFlowManager = new FilterFlowManager();

// 注册FilterGroup
filterFlowManager.addFilterGroup({
  name: 'dataTransform',
  title: '数据转换',
  sort: 1,
});

// 注册Filter
filterFlowManager.addFilter({
  name: 'filterData',
  title: '数据过滤',
  description: '根据条件过滤数据',
  group: 'dataTransform',
  sort: 1,
  uiSchema: {
    field: {
      type: 'string',
      title: '字段',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    operator: {
      type: 'string',
      title: '操作符',
      'x-component-props': {
        options: [
          { label: '等于', value: 'equals' },
          { label: '包含', value: 'contains' },
          { label: '大于', value: 'gt' },
          { label: '小于', value: 'lt' },
        ],
      },
      'x-decorator': 'FormItem',
      'x-component': 'Select',
    },
    value: {
      type: 'string',
      title: '值',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
  handler: (currentValue, params, context) => {
    if (Array.isArray(currentValue) && params.field && params.value !== undefined) {
      let filtered;

      switch (params.operator) {
        case 'equals':
          filtered = currentValue.filter((item) => item[params.field] === params.value);
          break;
        case 'contains':
          filtered = currentValue.filter((item) =>
            String(item[params.field]).toLowerCase().includes(String(params.value).toLowerCase()),
          );
          break;
        case 'greaterThan':
          filtered = currentValue.filter((item) => item[params.field] > params.value);
          break;
        case 'lessThan':
          filtered = currentValue.filter((item) => item[params.field] < params.value);
          break;
        default:
          filtered = currentValue;
      }

      return filtered;
    }
    return currentValue;
  },
});

filterFlowManager.addFilter({
  name: 'sortData',
  title: '数据排序',
  description: '对数据进行排序',
  group: 'dataTransform',
  sort: 2,
  uiSchema: {
    field: {
      type: 'string',
      title: '排序字段',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    order: {
      type: 'string',
      title: '排序方向',
      default: 'asc',
      enum: [
        { label: '升序', value: 'asc' },
        { label: '降序', value: 'desc' },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
  },
  handler: (currentValue, params, context) => {
    if (Array.isArray(currentValue) && params.field) {
      const sorted = [...currentValue].sort((a, b) => {
        const valueA = a[params.field];
        const valueB = b[params.field];
        if (valueA < valueB) return params.order === 'desc' ? 1 : -1;
        if (valueA > valueB) return params.order === 'desc' ? -1 : 1;
        return 0;
      });
      return sorted;
    }
    return currentValue;
  },
});

filterFlowManager.addFilter({
  name: 'mapData',
  title: '数据映射',
  description: '转换数据格式',
  group: 'dataTransform',
  sort: 3,
  uiSchema: {
    template: {
      type: 'string',
      title: '模板',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        placeholder: '例如: {{ item.name }} - {{ item.age }}',
      },
    },
  },
  handler: (currentValue, params, context) => {
    if (Array.isArray(currentValue)) {
      return currentValue.map((item) => {
        const result = { ...item };

        // 应用字段转换
        if (params.template) {
          let value = params.template;
          const matches = params.template.match(/\{([^}]+)\}/g) || [];

          for (const match of matches) {
            const fieldName = match.slice(1, -1);
            value = value.replace(match, item[fieldName] || '');
          }

          result.fullName = value;
        }

        return result;
      });
    }
    return currentValue;
  },
});

// 创建FilterFlow
filterFlowManager.addFlow({
  name: 'data-transform-flow',
  title: '数据转换流程',
  steps: [
    {
      key: 'filter-step',
      filterName: 'filterData',
      title: '过滤数据',
      params: {
        field: 'age',
        operator: 'gt',
        value: '25',
      },
    },
    {
      key: 'sort-step',
      filterName: 'sortData',
      title: '排序数据',
      params: {
        field: 'age',
        order: 'desc',
      },
    },
    {
      key: 'map-step',
      filterName: 'mapData',
      title: '格式化数据',
      params: {
        template: '{{ item.name }} ({{ item.age }}岁)',
      },
    },
  ],
});

// 示例数据
const sampleData = [
  { id: 1, name: 'John', surname: 'Doe', age: 28, city: 'New York' },
  { id: 2, name: 'Alice', surname: 'Smith', age: 24, city: 'London' },
  { id: 3, name: 'Bob', surname: 'Johnson', age: 32, city: 'Paris' },
  { id: 4, name: 'Emma', surname: 'Williams', age: 22, city: 'Berlin' },
  { id: 5, name: 'Michael', surname: 'Brown', age: 35, city: 'Tokyo' },
];

const DataTransformFilterFlow = () => {
  const [inputData] = useState(sampleData);
  const [outputData, setOutputData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const inputColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '姓氏', dataIndex: 'surname', key: 'surname' },
    { title: '年龄', dataIndex: 'age', key: 'age' },
    { title: '城市', dataIndex: 'city', key: 'city' },
  ];

  const outputColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '姓氏', dataIndex: 'surname', key: 'surname' },
    { title: '全名', dataIndex: 'fullName', key: 'fullName' },
    { title: '年龄', dataIndex: 'age', key: 'age' },
    { title: '明年年龄', dataIndex: 'ageNextYear', key: 'ageNextYear' },
    { title: '信息', dataIndex: 'info', key: 'info' },
    { title: '城市', dataIndex: 'city', key: 'city' },
  ];

  const handleApplyFilter = async () => {
    setIsProcessing(true);
    try {
      // 创建FilterFlow上下文
      const context = {
        payload: {},
      };

      // 应用FilterFlow
      const result = await filterFlowManager.applyFilters('data-transform-flow', inputData, context);

      setOutputData(result);
    } catch (error) {
      console.error('FilterFlow应用失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Paragraph>
        这个示例展示了如何创建一个处理复杂数据的FilterFlow。FilterFlow会:
        <ol>
          <li>过滤出年龄大于25的记录</li>
          <li>按姓名字母升序排序结果</li>
          <li>添加全名、信息和明年年龄字段</li>
        </ol>
      </Typography.Paragraph>

      <Card title="输入数据" style={{ marginBottom: 16 }}>
        <Table dataSource={inputData} columns={inputColumns} rowKey="id" pagination={false} size="small" />
      </Card>

      <Button type="primary" onClick={handleApplyFilter} loading={isProcessing} style={{ marginBottom: 16 }}>
        应用 FilterFlow
      </Button>

      {outputData.length > 0 && (
        <Card title="过滤和转换后的数据" style={{ marginBottom: 16 }}>
          <Table dataSource={outputData} columns={outputColumns} rowKey="id" pagination={false} size="small" />
        </Card>
      )}
    </div>
  );
};

export default DataTransformFilterFlow;
