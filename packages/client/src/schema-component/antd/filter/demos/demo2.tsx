import { CloseCircleOutlined } from '@ant-design/icons';
import { ArrayField as ArrayFieldModel, createForm, ObjectField as ObjectFieldModel } from '@formily/core';
import { ArrayField, connect, FormContext, ObjectField, observer, useField } from '@formily/react';
import { AntdSchemaComponentProvider, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import { Cascader, Input, Select, Space } from 'antd';
import flat from 'flat';
import React, { createContext, useContext, useMemo } from 'react';

const RemoveContext = createContext(null);

const useValues = () => {
  const field = useField<any>();
  const obj = flat(field.value || {});
  const key = Object.keys(obj).shift() || '';
  const [path, others = ''] = key.split('.$');
  let [operator] = others.split('.');
  const dataIndex = path.split('.');
  let maxDepth = dataIndex.length;
  if (operator) {
    operator = '$' + operator;
    ++maxDepth;
  }
  const values = flat(field.value || {}, { maxDepth });
  const value = Object.values<any>(values).shift();
  const operators = [
    { label: 'eq', value: '$eq' },
    { label: 'ne', value: '$ne' },
  ];
  const fields = [
    { label: 'AA', value: 'aa' },
    { label: 'BB', value: 'bb', children: [{ label: 'field', value: 'field' }] },
  ];
  return {
    dataIndex,
    fields,
    operators,
    operator,
    value,
    component: [Input, {}],
    // 当 dataIndex 变化，value 清空
    setDataIndex(di: string[]) {
      const op = operators?.[0]?.value || '$eq';
      field.value = flat.unflatten({
        [`${di.join('.')}.${op}`]: null,
      });
    },
    // 如果只是 Operator 变化，value 要保留
    setOperator(op: string) {
      field.value = flat.unflatten({
        [`${dataIndex.join('.')}.${op}`]: value,
      });
    },
    setValue(v: any) {
      field.value = flat.unflatten({
        [`${dataIndex.join('.')}.${operator || '$eq'}`]: v,
      });
    },
  };
};

const DynamicValue = (props) => {
  const form = useMemo(() => createForm(), []);
  return (
    <FormContext.Provider value={form}>
      <SchemaComponent schema={props.schema} />
    </FormContext.Provider>
  );
};

const FilterItem = observer((props: any) => {
  const field = useField<any>();
  const remove = useContext(RemoveContext);
  const { fields, operators, dataIndex, operator, setDataIndex, setOperator, value, setValue } = useValues();
  return (
    <div style={{ marginBottom: 8 }}>
      <Space>
        <Cascader
          value={dataIndex}
          options={fields}
          onChange={(value) => {
            setDataIndex(value);
          }}
        />
        <Select
          value={operator}
          options={operators}
          onChange={(value) => {
            setOperator(value);
          }}
        />
        <pre>{JSON.stringify(value, null, 2)}</pre>
        {/* <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        /> */}
        <CloseCircleOutlined onClick={() => remove()} />
      </Space>
    </div>
  );
});

const FilterItems = observer((props) => {
  const field = useField<ArrayFieldModel>();
  return (
    <div>
      {field?.value?.map((item, index) => {
        return (
          <RemoveContext.Provider value={() => field.remove(index)}>
            <ObjectField name={index} component={[item.$and || item.$or ? FilterGroup : FilterItem]} />
          </RemoveContext.Provider>
        );
      })}
    </div>
  );
});

const FilterGroup = connect((props) => {
  const field = useField<ObjectFieldModel>();
  const remove = useContext(RemoveContext);
  const keys = Object.keys(field.value || {});
  const logic = keys.includes('$or') ? '$or' : '$and';
  const setLogic = (value) => {
    const obj = field.value || {};
    field.value = {
      [value]: obj[logic] || [],
    };
  };
  return (
    <div
      style={{
        position: 'relative',
        border: '1px dashed #dedede',
        padding: 14,
        marginBottom: 8,
      }}
    >
      {remove && (
        <CloseCircleOutlined
          style={{
            position: 'absolute',
            right: 10,
          }}
          onClick={() => remove()}
        />
      )}
      <div style={{ marginBottom: 8 }}>
        满足以下{' '}
        <Select
          value={logic}
          options={[
            { label: '所有', value: '$and' },
            { label: '任意', value: '$or' },
          ]}
          onChange={(value) => {
            setLogic(value);
          }}
        />{' '}
        条件
      </div>
      <div>
        <ArrayField name={logic} component={[FilterItems]} />
      </div>
      <Space style={{ marginBottom: 8 }}>
        <a
          onClick={() => {
            const value = field.value || {};
            const items = value[logic] || [];
            items.push({});
            field.value = {
              [logic]: items,
            };
          }}
        >
          Add filter
        </a>
        <a
          onClick={() => {
            const value = field.value || {};
            const items = value[logic] || [];
            items.push({
              $and: [{}],
            });
            field.value = {
              [logic]: items,
            };
          }}
        >
          Add filter group
        </a>
      </Space>
    </div>
  );
});

const Filter = observer((props) => {
  const field = useField<ObjectFieldModel>();
  return (
    <div>
      <FilterGroup {...props} />
      <pre>{JSON.stringify(field.value, null, 2)}</pre>
    </div>
  );
});

const schema = {
  type: 'void',
  properties: {
    demo: {
      name: 'filter',
      type: 'object',
      default: flat.unflatten({
        $or: [
          { 'aa.$eq': 'b' },
          { 'bb.field.$eq': ['aabb', 'aaa'] },
          {
            'bb.field': {
              $eq: ['aabb', 'aaa'],
            },
          },
        ],
      }),
      'x-component': 'Filter',
      'x-component-props': {
        onChange: (value) => {
          console.log('=====', JSON.stringify(value, null, 2));
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <SchemaComponent components={{ Filter }} schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};
