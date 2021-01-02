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
  const { target, multiple, associatedName, labelField, valueField = 'id', value, onChange } = props;
  const [selectedKeys, selectedValue] = transform({value, multiple, labelField, valueField });
  const [visible, setVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState(multiple ? selectedKeys : [selectedKeys]);
  const [selectedRows, setSelectedRows] = useState(selectedValue);
  const [options, setOptions] = useState(selectedValue);
  // console.log('valuevaluevaluevaluevaluevalue', value);
  return (
    <>
      <Select
        open={false}
        mode={multiple ? 'tags' : undefined}
        labelInValue
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
            onChange(data);
            setSelectedRowKeys([]);
          }
        }}
        onClick={() => {
          setVisible(true);
        }}
      ></Select>
      <Drawer 
        width={'40%'}
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
          multiple={multiple}
          resourceName={target}
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
