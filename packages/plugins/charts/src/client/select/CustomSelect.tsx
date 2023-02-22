import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { isValid, toArr } from '@formily/shared';
import type { SelectProps } from 'antd';
import { Input, Popover, Select as AntdSelect } from 'antd';
import React from 'react';
import { ReadPretty } from './ReadPretty';
import { defaultFieldNames, getCurrentOptions } from './shared';
import { css } from '@emotion/css';

type Props = SelectProps<any, any> & { objectValue?: boolean; onChange?: (v: any) => void; multiple: boolean };

const isEmptyObject = (val: any) => !isValid(val) || (typeof val === 'object' && Object.keys(val).length === 0);

const { Option, OptGroup } = AntdSelect;
const filterOption = (input, option) => (option?.label ?? '').toLowerCase().includes((input || '').toLowerCase());

const InternalSelect = connect(
  (props: Props) => {
    const { ...others } = props;
    const { options, ...othersProps } = { ...others };
    console.log('props', props);
    const mode = props.mode || props.multiple ? 'multiple' : undefined;
    const group1 = options.filter(option => option.group === 2);
    const group2 = options.filter(option => option.group === 1);
    return (
      <AntdSelect
        showSearch
        filterOption={filterOption}
        allowClear
        {...othersProps}
        onChange={(changed) => {
          props.onChange?.(changed === undefined ? null : changed);
        }}
        onMouseEnter={(e) => {
          console.log(e);
        }
        }
        mode={mode}
      >
        <OptGroup label='分组1'>
          {
            group1.map(option => (
              <Option value={option.value} label={option.value}>
                <Popover zIndex={99999999999} content={() =>
                  (<span>
                      {
                        option?.label
                      }
                    </span>
                  )
                } trigger='hover'>
                  <div>
                    <span role='img' aria-label={option.label}>
                    🍉{option.value}
                    </span>
                  </div>
                </Popover>
              </Option>
            ))
          }
        </OptGroup>
        <OptGroup label='分组2'>
          {
            group2.map(option => (
              <Option value={option.value} label={option.label}>
                <div>
        <span role='img' aria-label={option.label}>
          🍉
        </span>
                  {option.value}
                </div>
              </Option>
            ))
          }
        </OptGroup>
      </AntdSelect>
    );
  },
  mapProps(
    {
      dataSource: 'options',
      loading: true,
    },
    (props, field) => {
      return {
        ...props,
        suffixIcon: field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props?.suffixIcon,
      };
    },
  ),
  mapReadPretty(ReadPretty),
);

export const CustomSelect = InternalSelect as unknown as typeof InternalSelect & {
  ReadPretty: typeof ReadPretty;
};

CustomSelect.ReadPretty = ReadPretty;

export default CustomSelect;
