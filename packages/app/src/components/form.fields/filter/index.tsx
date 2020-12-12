import React, { useEffect, useState } from 'react';
import { Button, Select, Input, Space, Form, InputNumber, DatePicker } from 'antd';
import { PlusCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import useDynamicList from './useDynamicList';
import { connect } from '@formily/react-schema-renderer'
import { mapStyledProps } from '../shared'
import moment from 'moment';

export function FilterGroup(props: any) {
  const { showDeleteButton = false, fields = [], onDelete, onChange, onAdd, dataSource = {} } = props;
  const { list, getKey, push, remove, replace } = useDynamicList<any>(dataSource.list || [
    {
      type: 'item',
    },
  ]);
  let style: any = {
    position: 'relative',
  };
  if (showDeleteButton) {
    style = {
      ...style,
      marginBottom: 14, 
      padding: 14,
      border: '1px dashed #dedede',
    }
  }
  return (
    <div style={style}>
      <div style={{marginBottom: 14}}>
        满足组内
        {' '}
        <Select style={{width: 80}} onChange={(value) => {
          onChange({...dataSource, andor: value});
        }} defaultValue={'and'}>
          <Select.Option value={'and'}>全部</Select.Option>
          <Select.Option value={'or'}>任意</Select.Option>
        </Select>
        {' '}
        条件
      </div>
      <div>
        {list.map((item, index) => {
          // console.log(item);
          const Component = item.type === 'group' ? FilterGroup : FilterItem;
          return (
            <div style={{marginBottom: 8}}>
              {<Component
                fields={fields}
                dataSource={item}
                showDeleteButton={list.length > 1}
                onChange={(value) => {
                  replace(index, value);
                  const newList = [...list];
                  newList[index] = value;
                  onChange({...dataSource, list: newList});
                  // console.log(list, value, index);
                }}
                onDelete={() => {
                  remove(index);
                  const newList = [...list];
                  newList.splice(index, 1);
                  onChange({...dataSource, list: newList});
                  // console.log(list, index);
                }}
              />}
            </div>
          );
        })}
      </div>
      <div>
        <Space>
          <Button style={{padding: 0}} type={'link'} onClick={() => {
            const data = {
              type: 'item'
            };
            push(data);
            const newList = [...list];
            newList.push(data);
            onChange({...dataSource, list: newList});
          }}>
            <PlusCircleOutlined /> 添加条件
          </Button>
          {' '}
          <Button
            style={{padding: 0}}
            type={'link'}
            onClick={() => {
              const data = {
                type: 'group',
                list: [
                  {
                    type: 'item',
                  },
                ],
              };
              push(data);
              const newList = [...list];
              newList.push(data);
              onChange({...dataSource, list: newList});
            }}
          >
            <PlusCircleOutlined /> 添加条件组
          </Button>
          {showDeleteButton && <Button style={{padding: 0, position: 'absolute', top: 0, right: 0, width: 32}} type={'link'} onClick={(e) => {
            onDelete && onDelete(e);
          }}>
            <CloseCircleOutlined />
          </Button>}
        </Space>
      </div>
    </div>
  );
}

interface FieldOptions {
  name: string;
  title: string;
  interface: string;
  [key: string]: any;
}

interface FilterItemProps {
  fields: FieldOptions[];
  [key: string]: any;
}

const OP_MAP = {
  string: [
    {label: '等于', value: 'eq'},
    {label: '不等于', value: 'neq'},
    {label: '包含', value: 'cont'},
    {label: '不包含', value: 'ncont'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
  number: [
    {label: '等于', value: 'eq'},
    {label: '不等于', value: 'neq'},
    {label: '大于', value: 'gt'},
    {label: '大于等于', value: 'gte'},
    {label: '小于', value: 'lt'},
    {label: '小于等于', value: 'lte'},
    {label: '介于', value: 'between'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
  file: [
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
  boolean: [
    {label: '等于', value: 'eq'},
  ],
  choices: [
    {label: '等于', value: 'eq'},
    {label: '不等于', value: 'neq'},
    {label: '包含', value: 'cont'},
    {label: '不包含', value: 'ncont'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
  datetime: [
    {label: '等于', value: 'eq'},
    {label: '不等于', value: 'neq'},
    {label: '大于', value: 'gt'},
    {label: '大于等于', value: 'gte'},
    {label: '小于', value: 'lt'},
    {label: '小于等于', value: 'lte'},
    {label: '介于', value: 'between'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
    {label: '是今天', value: 'now'},
    {label: '在今天之前', value: 'before_today'},
    {label: '在今天之后', value: 'after_today'},
  ],
  linkTo: [
    {label: '包含', value: 'cont'},
    {label: '不包含', value: 'ncont'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
};

const op = {
  string: OP_MAP.string,
  textarea: OP_MAP.string,
  number: OP_MAP.number,
  percent: OP_MAP.number,
  datetime: OP_MAP.datetime,
  date: OP_MAP.datetime,
};

const StringInput = (props) => {
  const { onChange, ...restProps } = props;
  return (
    <Input {...restProps} onChange={(e) => {
      onChange(e.target.value);
    }}/>
  );
}

const controls = {
  string: StringInput,
  textarea: StringInput,
  number: InputNumber,
  // datetime: DatePicker,
  date: (props) => {
    const { value, onChange, ...restProps } = props;
    const m = moment(value, 'YYYY-MM-DD HH:mm:ss');
    return (
      <DatePicker value={m.isValid() ? m : null} onChange={(value) => {
        onChange(value ? value.format('YYYY-MM-DD HH:mm:ss') : null)
        console.log(value.format('YYYY-MM-DD HH:mm:ss'));
      }}/>
    );
  },
};

export function FilterItem(props: FilterItemProps) {
  const { index, fields = [], showDeleteButton = false, onDelete, onChange, dataSource = {} } = props;
  const [type, setType] = useState('string');
  useEffect(() => {
    const field = fields.find(field => field.name === dataSource.column);
    if (field) {
      setType(field.component.type);
    }
  }, [
    dataSource,
  ]);
  console.log({type});
  const ValueControl = controls[type]||controls.string;
  return (
    <Space>
      <Select value={dataSource.column}
        onChange={(value) => {
          const field = fields.find(field => field.name === value);
          if (field) {
            setType(field.interface);
          }
          onChange({...dataSource, column: value});
        }}
        style={{ width: 120 }} 
        placeholder={'选择字段'}>
        {fields.map(field => (
          <Select.Option value={field.name}>{field.title}</Select.Option>
        ))}
      </Select>
      <Select value={dataSource.op} style={{ minWidth: 100 }}
        onChange={(value) => {
          onChange({...dataSource, op: value});
        }}
      >
        {(op[type]||op.string).map(option => (
          <Select.Option value={option.value}>{option.label}</Select.Option>
        ))}
      </Select>
      <ValueControl value={dataSource.value} onChange={(value) => {
        onChange({...dataSource, value: value});
      }} 
      style={{ width: 180 }}
      />
      {showDeleteButton && (
        <Button type={'link'} style={{padding: 0}} onClick={(e) => {
          onDelete && onDelete(e);
        }}><CloseCircleOutlined /></Button>
      )}
    </Space>
  );
}

function toFilter(values: any) {
  let filter: any;
  const { type, andor = 'and', list = [], column, op, value } = values;
  if (type === 'group') {
    filter = {
      [andor]: list.map(value => toFilter(value)).filter(Boolean)
    }
  } else if (type === 'item' && column && op) {
    filter = {
      [`${column}`]: {[op]: value},
    }
  }
  return filter;
}

export const Filter = connect({
  getProps: mapStyledProps,
})((props) => {
  const dataSource = {
    type: 'group',
    list: [
      {
        type: 'item',
      }
    ],
  };
  const { value, onChange, ...restProps } = props;
  return <FilterGroup dataSource={dataSource} onChange={(values) => {
    onChange(toFilter(values));
  }} {...restProps}/>
});

export default Filter;
