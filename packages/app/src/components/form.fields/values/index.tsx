import React, { useCallback, useEffect, useState } from 'react';
import { Button, Select, Input, Space, Form, InputNumber, DatePicker, TimePicker, Radio } from 'antd';
import { PlusCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import useDynamicList from './useDynamicList';
import { connect } from '@formily/react-schema-renderer'
import { mapStyledProps } from '../shared'
import get from 'lodash/get';
import moment from 'moment';
import './style.less';
import api from '@/api-client';
import { useRequest } from 'umi';

export function FilterGroup(props: any) {
  const { fields = [], sourceFields = [], onDelete, onChange, onAdd, dataSource = [] } = props;
  const { list, getKey, push, remove, replace } = useDynamicList<any>(dataSource);
  let style: any = {
    position: 'relative',
  };
  return (
    <div style={style}>
      <div>
        {list.map((item, index) => {
          // console.log(item);
          // const Component = item.type === 'group' ? FilterGroup : FilterItem;
          return (
            <div style={{marginBottom: 8}}>
              {<FilterItem
                fields={fields}
                sourceFields={sourceFields}
                dataSource={item}
                // showDeleteButton={list.length > 1}
                onChange={(value) => {
                  replace(index, value);
                  const newList = [...list];
                  newList[index] = value;
                  onChange(newList);
                  // console.log(list, value, index);
                }}
                onDelete={() => {
                  remove(index);
                  const newList = [...list];
                  newList.splice(index, 1);
                  onChange(newList);
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
            const data = {};
            push(data);
            const newList = [...list];
            newList.push(data);
            onChange(newList);
          }}>
            <PlusCircleOutlined /> 新增一个字段赋值
          </Button>
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
    {label: '包含', value: '$includes', selected: true},
    {label: '不包含', value: '$notIncludes'},
    {label: '等于', value: 'eq'},
    {label: '不等于', value: 'ne'},
    {label: '非空', value: '$notNull'},
    {label: '为空', value: '$null'},
  ],
  number: [
    {label: '等于', value: 'eq', selected: true},
    {label: '不等于', value: 'ne'},
    {label: '大于', value: 'gt'},
    {label: '大于等于', value: 'gte'},
    {label: '小于', value: 'lt'},
    {label: '小于等于', value: 'lte'},
    // {label: '介于', value: 'between'},
    {label: '非空', value: '$notNull'},
    {label: '为空', value: '$null'},
  ],
  file: [
    {label: '存在', value: 'id.gt'},
    {label: '不存在', value: 'id.$null'},
  ],
  boolean: [
    {label: '是', value: '$isTruly', selected: true},
    {label: '否', value: '$isFalsy'},
  ],
  select: [
    {label: '等于', value: 'eq', selected: true},
    {label: '不等于', value: 'ne'},
    {label: '包含', value: 'in'},
    {label: '不包含', value: 'notIn'},
    {label: '非空', value: '$notNull'},
    {label: '为空', value: '$null'},
  ],
  multipleSelect: [
    {label: '等于', value: '$match', selected: true},
    {label: '不等于', value: '$notMatch'},
    {label: '包含', value: '$anyOf'},
    {label: '不包含', value: '$noneOf'},
    {label: '非空', value: '$notNull'},
    {label: '为空', value: '$null'},
  ],
  datetime: [
    {label: '等于', value: '$dateOn', selected: true},
    {label: '不等于', value: '$dateNotOn'},
    {label: '早于', value: '$dateBefore'},
    {label: '晚于', value: '$dateAfter'},
    {label: '不早于', value: '$dateNotBefore'},
    {label: '不晚于', value: '$dateNotAfter'},
    // {label: '介于', value: 'between'},
    {label: '非空', value: '$notNull'},
    {label: '为空', value: '$null'},
    // {label: '是今天', value: 'now'},
    // {label: '在今天之前', value: 'before_today'},
    // {label: '在今天之后', value: 'after_today'},
  ],
  time: [
    {label: '等于', value: 'eq', selected: true},
    {label: '不等于', value: 'neq'},
    {label: '大于', value: 'gt'},
    {label: '大于等于', value: 'gte'},
    {label: '小于', value: 'lt'},
    {label: '小于等于', value: 'lte'},
    // {label: '介于', value: 'between'},
    {label: '非空', value: '$notNull'},
    {label: '为空', value: '$null'},
    // {label: '是今天', value: 'now'},
    // {label: '在今天之前', value: 'before_today'},
    // {label: '在今天之后', value: 'after_today'},
  ],
  // linkTo: [
  //   {label: '包含', value: 'cont'},
  //   {label: '不包含', value: 'ncont'},
  //   {label: '非空', value: '$notNull'},
  //   {label: '为空', value: '$null'},
  // ],
};

const op = {
  string: OP_MAP.string,
  textarea: OP_MAP.string,
  number: OP_MAP.number,
  percent: OP_MAP.number,
  datetime: OP_MAP.datetime,
  date: OP_MAP.datetime,
  time: OP_MAP.time,
  checkbox: OP_MAP.boolean,
  boolean: OP_MAP.boolean,
  select: OP_MAP.select,
  multipleSelect: OP_MAP.multipleSelect,
  checkboxes: OP_MAP.multipleSelect,
  radio: OP_MAP.select,
  upload: OP_MAP.file,
  attachment: OP_MAP.file,
};

const StringInput = (props) => {
  const {value, onChange, ...restProps } = props;
  return (
    <Input {...restProps} defaultValue={value} onChange={(e) => {
      onChange(e.target.value);
    }}/>
  );
}

const controls = {
  string: StringInput,
  textarea: StringInput,
  number: InputNumber,
  percent: (props) => (
    <InputNumber 
      formatter={value => value ? `${value}%` : ''}
      parser={value => value.replace('%', '')}
      {...props}
    />
  ),
  boolean: BooleanControl,
  checkbox: BooleanControl,
  select: OptionControl,
  radio: OptionControl,
  checkboxes: OptionControl,
  multipleSelect: OptionControl,
  time: TimeControl,
  date: DateControl,
};

function DateControl(props: any) {
  const { field, value, onChange, ...restProps } = props;
  let format = field.dateFormat;
  // if (field.showTime) {
  //   format += ` ${field.timeFormat}`;
  // }
  const m = moment(value, format);
  return (
    <DatePicker format={format} value={m.isValid() ? m : null} onChange={(value) => {
      onChange(value ? value.format('YYYY-MM-DD') : null)
    }}/>
  );
  // return (
  //   <DatePicker format={format} showTime={field.showTime} value={m.isValid() ? m : null} onChange={(value) => {
  //     onChange(value ? value.format(field.showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD') : null)
  //   }}/>
  // );
}

function TimeControl(props: any) {
  const { field, value, onChange, ...restProps } = props;
  let format = field.timeFormat;
  const m = moment(value, format);
  return <TimePicker
    value={m.isValid() ? m : null}
    format={field.timeFormat}
    onChange={(value) => {
      onChange(value ? value.format('HH:mm:ss') : null)
    }}
  />
}

function OptionControl(props) {
  const { multiple = true, op, options, value, onChange, ...restProps } = props;
  let mode: any = 'multiple';
  if (!multiple && ['eq', 'ne'].indexOf(op) !== -1) {
    mode = undefined;
  }
  return (
    <Select style={{ minWidth: 120 }} mode={mode} value={value} onChange={(value) => {
      onChange(value);
    }} options={options}>
    </Select>
  );
}

function BooleanControl(props) {
  const { value, onChange, ...restProps } = props;
  return (
    <Radio.Group value={value} onChange={(e) => {
      onChange(e.target.value);
    }}>
      <Radio value={true}>是</Radio>
      <Radio value={false}>否</Radio>
    </Radio.Group>
  );
}

function NullControl(props) {
  return null;
}

export function FilterItem(props: FilterItemProps) {
  const { index, fields = [], sourceFields = [], showDeleteButton = true, onDelete, onChange } = props;
  const [type, setType] = useState('string');
  const [field, setField] = useState<any>({});
  const [dataSource, setDataSource] = useState(props.dataSource||{});
  useEffect(() => {
    const field = fields.find(field => field.name === props.dataSource.column);
    if (field) {
      setField(field);
      let componentType = field.component.type;
      if (field.component.type === 'select' && field.multiple) {
        componentType = 'multipleSelect';
      }
      setType(componentType);
    }
    setDataSource({...props.dataSource});
  }, [
    props.dataSource, type,
  ]);
  let ValueControl = controls[type]||controls.string;
  if (['truncate'].indexOf(dataSource.op) !== -1) {
    ValueControl = NullControl;
  } else if (dataSource.op === 'ref') {
    ValueControl = () => {
      return (
        <Select value={dataSource.value}
          onChange={(value) => {
            onChange({...dataSource, value: value});
          }}
          style={{ width: 120 }} 
          placeholder={'选择字段'}>
          {sourceFields.map(field => (
            <Select.Option value={field.name}>{field.title}</Select.Option>
          ))}
        </Select>
      )
    }
  }
  // let multiple = true;
  // if ()
  // const opOptions = op[type]||op.string;
  const opOptions = [
    {label: '自定义填写', value: 'eq', selected: true},
    {label: '等于触发数据', value: 'ref'},
    {label: '清空数据', value: 'truncate'},
  ];
  console.log({field, dataSource, type, ValueControl});
  return (
    <Space>
      <Select value={dataSource.column}
        onChange={(value) => {
          const field = fields.find(field => field.name === value);
          let componentType = field.component.type;
          if (field.component.type === 'select' && field.multiple) {
            componentType = 'multipleSelect';
          }
          setType(componentType);
          onChange({...dataSource, column: value, op: get(opOptions, [0, 'value']), value: undefined});
        }}
        style={{ width: 120 }} 
        placeholder={'选择字段'}>
        {fields.map(field => (
          <Select.Option value={field.name}>{field.title}</Select.Option>
        ))}
      </Select>
      <Select value={dataSource.column ? dataSource.op : null} style={{ minWidth: 130 }}
        onChange={(value) => {
          onChange({...dataSource, op: value, value: undefined});
        }}
        defaultValue={get(opOptions, [0, 'value'])}
        options={opOptions}
      >
        {/* {(op[type]||op.string).map(option => (
          <Select.Option value={option.value}>{option.label}</Select.Option>
        ))} */}
      </Select>
      <ValueControl 
        field={field} 
        multiple={type === 'checkboxes' || !!field.multiple} 
        op={dataSource.op} 
        options={field.dataSource} 
        value={dataSource.value} 
        onChange={(value) => {
          onChange({...dataSource, value: value});
        }}
        style={{ width: 180 }}
      />
      {showDeleteButton && (
        <Button className={'filter-remove-link filter-item'} type={'link'} style={{padding: 0}} onClick={(e) => {
          onDelete && onDelete(e);
        }}><CloseCircleOutlined /></Button>
      )}
    </Space>
  );
}

export const Values = connect({
  getProps: mapStyledProps,
})((props) => {
  
  const { value = [], onChange, associatedKey, sourceName, sourceFilter = {}, filter = {}, fields = [], ...restProps } = props;

  const { data = [], loading = true } = useRequest(() => {
    return associatedKey ? api.resource(`collections.fields`).list({
      associatedKey,
      filter,
    }) : Promise.resolve({
      data: fields,
    });
  }, {
    refreshDeps: [associatedKey]
  });

  const { data: sourceFields = [] } = useRequest(() => {
    return sourceName ? api.resource(`collections.fields`).list({
      associatedKey: sourceName,
      filter: sourceFilter,
    }) : Promise.resolve({
      data: [],
    });
  }, {
    refreshDeps: [sourceName]
  });

  return <FilterGroup dataSource={Array.isArray(value) ? value.filter(item => Object.keys(item).length) : []} onChange={(values) => {
    onChange(values.filter(item => Object.keys(item).length));
  }} {...restProps} fields={data} sourceFields={sourceFields}/>
});

export default Values;
