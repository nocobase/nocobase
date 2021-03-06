import React, { useState } from 'react'
import { connect } from '@formily/react-schema-renderer'
import { Select, Button, Space } from 'antd'
import {
  mapStyledProps,
  mapTextComponent,
  compose,
  isStr,
  isArr
} from '../shared'
import ViewFactory from '@/components/views'
import Drawer from '@/components/pages/AdminLoader/Drawer';
import View from '@/components/pages/AdminLoader/View';

function transform({value, multiple, labelField, valueField = 'id'}) {
  let selectedKeys = [];
  let selectedValue = [];
  const values = Array.isArray(value) ? value : [value];
  selectedKeys = values.filter(item => item).map(item => item[valueField]);
  selectedValue = values.filter(item => item).map(item => {
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

export function DrawerSelectComponent(props) {
  const { size, schema = {}, disabled, viewName, target, multiple, filter, resourceName, associatedKey, labelField, valueField = 'id', value, onChange } = props;
  const [selectedKeys, selectedValue] = transform({value, multiple, labelField, valueField });
  const [selectedRowKeys, setSelectedRowKeys] = useState(multiple ? selectedKeys : [selectedKeys]);
  const [selectedRows, setSelectedRows] = useState(selectedValue);
  const [options, setOptions] = useState(selectedValue);
  const { title = '' } = schema;
  return (
    <>
      <Select
        disabled={disabled}
        open={false}
        mode={multiple ? 'tags' : undefined}
        labelInValue
        size={size}
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
            Drawer.open({
              title: `选择要关联的${title}数据`,
              content: ({resolve}) => {
                console.log('valuevaluevaluevaluevaluevalue', selectedRowKeys, selectedRows, options);
                const [rows, setRows] = useState(selectedRows);
                const [rowKeys, setRowKeys] = useState(selectedRowKeys)
                const [selected, setSelected] = useState(Array.isArray(value) ? value : [value]);
                console.log({selectedRowKeys});
                return (
                  <>
                    <View
                      associatedKey={associatedKey}
                      multiple={multiple}
                      defaultFilter={filter}
                      defaultSelectedRowKeys={selectedRowKeys}
                      onSelected={(values) => {
                        setSelected(values);
                        const [selectedKeys, selectedValue] = transform({value: values, multiple: true, labelField, valueField });
                        setSelectedRows(selectedValue);
                        setRows(selectedValue);
                        setSelectedRowKeys(selectedKeys);
                        setRowKeys(selectedKeys);
                        console.log({ values, selectedValue, selectedKeys });
                        console.log({selectedRows, selectedRowKeys});
                      }}
                      viewName={viewName || `${target}.table`}
                    />
                    <Drawer.Footer>
                    <Button onClick={() => {
                        setOptions(rows);
                        // console.log('valuevaluevaluevaluevaluevalue', {selectedRowKeys});
                        onChange(multiple ? selected : selected.shift());
                        // console.log({rows, rowKeys});
                        resolve();
                      }} type={'primary'}>确定</Button>
                    </Drawer.Footer>
                  </>
                )
              },
            })
            // setVisible(true);
          }
        }}
      ></Select>
      {/* <Drawer 
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
      </Drawer> */}
    </>
  );
}

export const DrawerSelect = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(DrawerSelectComponent)

export default DrawerSelect
