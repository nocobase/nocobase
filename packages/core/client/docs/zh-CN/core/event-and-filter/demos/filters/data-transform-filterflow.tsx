import { Button, Card, Table, Space, Typography } from 'antd';
import React, { useMemo, useState, useEffect } from 'react';
import { FilterFlowManager, BaseModel } from '@nocobase/client';

// 创建FilterFlowManager实例
const filterFlowManager = new FilterFlowManager();

// 注册FilterGroup
filterFlowManager.addFilterGroup({
  name: 'dataTransform',
  title: '数据转换',
  sort: 1,
});

// 创建一个数据转换模型
class DataModel extends BaseModel {
  constructor(data: any[]) {
    super('data-model');
    this.setProps({
      data: data, // 原始数据
      processedData: [...data], // 处理后的数据，初始值为原始数据的副本
    });
  }
}

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
  handler: (model: DataModel, params, context) => {
    const data = model.getProps().processedData as any[];
    if (Array.isArray(data) && params?.field && params?.value !== undefined) {
      let filtered;

      switch (params.operator) {
        case 'equals':
          filtered = data.filter((item) => item[params.field] === params.value);
          break;
        case 'contains':
          filtered = data.filter((item) =>
            String(item[params.field]).toLowerCase().includes(String(params.value).toLowerCase()),
          );
          break;
        case 'gt':
          filtered = data.filter((item) => item[params.field] > Number(params.value));
          break;
        case 'lt':
          filtered = data.filter((item) => item[params.field] < Number(params.value));
          break;
        default:
          filtered = data;
      }

      model.setProps('processedData', filtered);
    }
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
  handler: (model: DataModel, params, context) => {
    const data = model.getProps().processedData as any[];
    if (Array.isArray(data) && params?.field) {
      const sorted = [...data].sort((a, b) => {
        const valueA = a[params.field];
        const valueB = b[params.field];
        if (valueA < valueB) return params.order === 'desc' ? 1 : -1;
        if (valueA > valueB) return params.order === 'desc' ? -1 : 1;
        return 0;
      });
      model.setProps('processedData', sorted);
    }
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
  handler: (model: DataModel, params, context) => {
    const data = model.getProps().processedData as any[];
    if (Array.isArray(data)) {
      const mappedData = data.map((item) => {
        const result = { ...item };

        // 应用字段转换
        if (params?.template) {
          let value = params.template;
          // 简化处理：将 {{ item.xxx }} 替换为对应的值
          Object.keys(item).forEach(fieldName => {
            const pattern = new RegExp(`\\{\\{\\s*item\\.${fieldName}\\s*\\}\\}`, 'g');
            value = value.replace(pattern, item[fieldName] || '');
          });
          result.fullName = value;
        }

        return result;
      });
      model.setProps('processedData', mappedData);
    }
  },
});

// 创建FilterFlow
filterFlowManager.addFlow({
  key: 'data-transform-flow',
  title: '数据转换流程',
  steps: [
    {
      key: 'filter-step',
      filterName: 'filterData',
      title: '过滤数据',
    },
    {
      key: 'sort-step',
      filterName: 'sortData',
      title: '排序数据',
    },
    {
      key: 'map-step',
      filterName: 'mapData',
      title: '格式化数据',
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

  useEffect(() => {
    // 创建模型实例
    const model = new DataModel(inputData);

    // 设置过滤器参数
    model.setFilterParams('data-transform-flow', 'filter-step', {
      field: 'age',
      operator: 'gt',
      value: '25',
    });

    model.setFilterParams('data-transform-flow', 'sort-step', {
      field: 'age',
      order: 'desc',
    });

    model.setFilterParams('data-transform-flow', 'map-step', {
      template: '{{ item.name }} ({{ item.age }}岁)',
    });

    // 应用过滤器流
    filterFlowManager.applyFilters('data-transform-flow', model, {})
      .then(() => {
        // 获取处理后的结果
        setOutputData(model.getProps().processedData || []);
      })
      .catch(console.error);
  }, [inputData]);

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
    { title: '城市', dataIndex: 'city', key: 'city' },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', borderRadius: 8 }}>
      <Typography.Paragraph>
        这个示例展示了如何创建一个处理复杂数据的FilterFlow。FilterFlow会:
        <ol>
          <li>过滤出年龄大于25的记录</li>
          <li>按年龄降序排序结果</li>
          <li>添加全名字段</li>
        </ol>
      </Typography.Paragraph>

      <Card title="输入数据" style={{ marginBottom: 16 }}>
        <Table dataSource={inputData} columns={inputColumns} rowKey="id" pagination={false} size="small" />
      </Card>

      {outputData.length > 0 && (
        <Card title="过滤和转换后的数据" style={{ marginBottom: 16 }}>
          <Table dataSource={outputData} columns={outputColumns} rowKey="id" pagination={false} size="small" />
        </Card>
      )}
    </div>
  );
};

export default DataTransformFilterFlow;
