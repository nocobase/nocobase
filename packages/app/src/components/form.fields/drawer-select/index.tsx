import React, { useState } from 'react'
import { connect } from '@formily/react-schema-renderer'
import { Select, Drawer, Button, Space } from 'antd'
import {
  mapStyledProps,
  mapTextComponent,
  compose,
  isStr,
  isArr
} from '../shared'
import ViewFactory from '@/components/views'

function transform({value, multiple, labelField, valueField = 'id'}) {
  let selectedKeys = [];
  let selectedValue = [];
  const values = Array.isArray(value) ? value : [];
  selectedKeys = values.map(item => item[valueField]);
  selectedValue = values.map(item => {
    return {
      value: item[valueField],
      label: item[labelField],
    }
  });
  if (!multiple) {
    return [selectedKeys.shift(), selectedValue.shift()];
  }
  return [selectedKeys, selectedValue];
}

function DrawerSelectComponent(props) {
  const { disabled, target, multiple, filter, resourceName, associatedKey, labelField, valueField = 'id', value, onChange } = props;
  const [selectedKeys, selectedValue] = transform({value, multiple, labelField, valueField });
  const [visible, setVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState(multiple ? selectedKeys : [selectedKeys]);
  const [selectedRows, setSelectedRows] = useState(selectedValue);
  const [options, setOptions] = useState(selectedValue);
  // console.log('valuevaluevaluevaluevaluevalue', value);
  return (
    <>
      <Select
        disabled={disabled}
        open={false}
        mode={multiple ? 'tags' : undefined}
        labelInValue
        allowClear={true}
        value={options}
        notFoundContent={''}
        onChange={(data) => {
          setOptions(data);
          if (Array.isArray(data)) {
            const srks = data.map(item => item.value);
            onChange(srks);
            setSelectedRowKeys(srks);
            console.log('datadatadatadata', {data, srks});
          } else if (data && typeof data === 'object') {
            onChange(data.value);
            setSelectedRowKeys([data.value]);
          } else {
            console.log(data);
            onChange(null);
            setSelectedRowKeys([]);
          }
        }}
        onClick={() => {
          if (!disabled) {
            setVisible(true);
          }
        }}
      ></Select>
      <Drawer 
        width={'40%'}
        className={'noco-drawer'}
        title={'关联数据'}
        visible={visible}
        bodyStyle={{padding: 0}}
        onClose={() => {
          setVisible(false);
        }}
        footer={[
          <div
            style={{
              textAlign: 'right',
            }}
          >
            <Space>
              <Button onClick={() => setVisible(false)}>取消</Button>
              <Button type={'primary'} onClick={() => {
                setOptions(selectedRows);
                // console.log('valuevaluevaluevaluevaluevalue', {selectedRowKeys});
                onChange(multiple ? selectedRowKeys : selectedRowKeys.shift());
                setVisible(false);
              }}>确定</Button>
            </Space>
          </div>
          
        ]}
      >
        <ViewFactory
          defaultFilter={filter}
          multiple={multiple}
          resourceTarget={target}
          resourceName={associatedKey ? resourceName : target}
          associatedKey={associatedKey}
          isFieldComponent={true}
          selectedRowKeys={selectedRowKeys}
          onSelected={(values) => {
            // 需要返回的是 array
            const [selectedKeys, selectedValue] = transform({value: values, multiple: true, labelField, valueField });
            setSelectedRows(selectedValue);
            setSelectedRowKeys(selectedKeys);
            // console.log('valuevaluevaluevaluevaluevalue', {values, selectedKeys, selectedValue});
          }}
          // associatedKey={} 
          // associatedName={associatedName} 
          viewName={'table'}
        />
      </Drawer>
    </>
  );
}

export const DrawerSelect = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(DrawerSelectComponent)

export default DrawerSelect
