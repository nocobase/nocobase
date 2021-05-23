import React from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { Select, Tag } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import Drawer from '../../components/Drawer';
import { useRequest } from 'ahooks';
import { isArr, isValid } from '@formily/shared';

function getFieldName(field: any) {
  if (typeof field === 'string') {
    return field;
  }
  if (typeof field === 'object') {
    return field.name;
  }
}

export const DrawerSelect = connect(
  (props) => {
    const {
      value,
      dataRequest,
      labelField: lf,
      valueField: vf,
      renderTag,
      renderOptions,
      onChange,
      ...others
    } = props;
    const labelField = getFieldName(lf);
    const valueField = getFieldName(vf);
    const getValues = () => {
      if (!isValid(value)) {
        return [];
      }
      return isArr(value) ? value : [value];
    }
    const getOptionValue = () => {
      const values = getValues().map((item) => {
        return {
          value: item[valueField],
          label: item[labelField],
        };
      });
      if (props.mode === 'multiple' || props.mode === 'tags') {
        return values;
      }
      return values.length ? values[0] : null;
    };
    return (
      <Select
        {...others}
        labelInValue
        open={false}
        value={getOptionValue()}
        options={[]}
        onChange={(selectValue) => {
          const getSelectValue = () => {
            const selected = isArr(selectValue) ? selectValue : [selectValue];
            return selected.map((item: any) => item.value);
          }
          const selected = getSelectValue();
          const values = getValues().filter(item => {
            return selected.includes(item[valueField]);
          });
          onChange(values);
        }}
        onClick={(e) => {
          Drawer.open({
            title: '选择数据',
            content: (contentProps) => {
              return renderOptions ? renderOptions({ ...contentProps, onChange }) : null;
            },
          });
        }}
      />
    );
  },
  mapProps((props, field) => {
    return {
      ...props,
      suffix: (
        <span>
          {field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffix
          )}
        </span>
      ),
    };
  }),
  mapReadPretty((props) => {
    const {
      value,
      dataRequest,
      labelField: lf,
      valueField: vf,
      renderItem,
      renderTag,
      ...others
    } = props;
    const labelField = getFieldName(lf);
    const valueField = getFieldName(vf);
    const getValues = () => {
      if (!isValid(value)) {
        return [];
      }
      return isArr(value) ? value : [value];
    }
    const values = getValues();
    return (
      <div>
        {values.map((item) => (
          <a
            onClick={() => {
              Drawer.open({
                title: item[labelField],
                content: (contentProps) => {
                  return renderItem
                    ? renderItem({ ...contentProps, item })
                    : null;
                },
              });
            }}
          >
            {renderTag ? renderTag(item) : item[labelField]}
          </a>
        ))}
      </div>
    );
  }),
);

export default DrawerSelect;
