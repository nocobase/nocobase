import { Button, Card, Table, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { FilterFlowManager } from '../libs/filterflow-manager';

// 创建过滤器管理器实例
const filterFlowManager = new FilterFlowManager();

// 注册过滤器处理器组
filterFlowManager.addFilterHandlerGroup({
  name: 'dataTransform',
  title: '数据转换',
  sort: 1,
});

// 注册过滤器处理器 - 排序
filterFlowManager.addFilterHandler({
  name: 'sortData',
  title: '数据排序',
  description: '按指定字段对数据进行排序',
  group: 'dataTransform',
  sort: 1,
  uiSchema: {},
  handler: (currentValue, params, context) => {
    if (Array.isArray(currentValue) && params.field) {
      const sorted = [...currentValue].sort((a, b) => {
        const valueA = a[params.field];
        const valueB = b[params.field];
        if (valueA < valueB) return params.direction === 'desc' ? 1 : -1;
        if (valueA > valueB) return params.direction === 'desc' ? -1 : 1;
        return 0;
      });
      return sorted;
    }
    return currentValue;
  },
});

// 注册过滤器处理器 - 过滤
filterFlowManager.addFilterHandler({
  name: 'filterData',
  title: '数据过滤',
  description: '按条件过滤数据',
  group: 'dataTransform',
  sort: 2,
  uiSchema: {},
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

// 注册过滤器处理器 - 映射
filterFlowManager.addFilterHandler({
  name: 'mapData',
  title: '数据映射',
  description: '转换数据结构',
  group: 'dataTransform',
  sort: 3,
  uiSchema: {},
  handler: (currentValue, params, context) => {
    if (Array.isArray(currentValue)) {
      return currentValue.map((item) => {
        const result = { ...item };

        // 应用字段转换
        if (params.transformations) {
          for (const [field, transform] of Object.entries(params.transformations)) {
            if (transform['type'] === 'format' && transform['template']) {
              // 简单的模板替换
              let value = transform['template'];
              const matches = transform['template'].match(/\{([^}]+)\}/g) || [];

              for (const match of matches) {
                const fieldName = match.slice(1, -1);
                value = value.replace(match, item[fieldName] || '');
              }

              result[field] = value;
            } else if (transform['type'] === 'compute' && transform['expression']) {
              // 简单的计算
              try {
                // 安全的表达式求值
                const compute = new Function(...Object.keys(item), `return ${transform['expression']}`);
                result[field] = compute(...Object.values(item));
              } catch (e) {
                console.error('计算表达式错误', e);
              }
            }
          }
        }

        return result;
      });
    }
    return currentValue;
  },
});

// 创建数据转换过滤器流
filterFlowManager.addFlow({
  name: 'data-transform-flow',
  title: '数据转换流',
  steps: [
    {
      key: 'filter-step',
      filterHandlerName: 'filterData',
      title: '过滤年龄大于25的数据',
      params: {
        field: 'age',
        operator: 'greaterThan',
        value: 25,
      },
    },
    {
      key: 'sort-step',
      filterHandlerName: 'sortData',
      title: '按姓名排序',
      params: {
        field: 'name',
        direction: 'asc',
      },
    },
    {
      key: 'map-step',
      filterHandlerName: 'mapData',
      title: '添加全名和信息字段',
      params: {
        transformations: {
          fullName: {
            type: 'format',
            template: '{name} {surname}',
          },
          info: {
            type: 'format',
            template: '{name} is {age} years old',
          },
          ageNextYear: {
            type: 'compute',
            expression: 'age + 1',
          },
        },
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
      // 创建过滤上下文
      const context = {
        props: {},
      };

      // 应用过滤器流
      const result = await filterFlowManager.applyFilters('data-transform-flow', inputData, context);

      setOutputData(result);
    } catch (error) {
      console.error('过滤器应用失败:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Title level={4}>数据转换过滤器流</Typography.Title>
      <Typography.Paragraph>
        这个示例展示了如何创建一个处理复杂数据的过滤器流。过滤器流程会:
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
        应用过滤器
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
