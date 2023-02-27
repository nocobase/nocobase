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
        mode={mode}
      >
        <OptGroup label='基础图表'>
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
                  <div className={css`display: flex;
                    gap: 4px;
                    align-items: center`}>
                    <svg width='1em' height='1em' fill='currentColor' aria-hidden='true' focusable='false' className=''>
                      <use
                        href={`#${option.iconId}`}>
                      </use>
                    </svg>
                    <span role='img' aria-label={option.label}>
                      {option.value}
                    </span>
                  </div>
                </Popover>
              </Option>
            ))
          }
        </OptGroup>
        <OptGroup label='更多图表'>
          {
            group2.map(option => (
              <Option value={option.value} label={option.label}>
                <div className={css`display: flex;
                  gap: 4px;
                  align-items: center`}>
                  <svg width='1em' height='1em' fill='currentColor' aria-hidden='true' focusable='false' className=''>
                    <use
                      href={`#${option.iconId}`}>
                    </use>
                  </svg>
                  <span role='img' aria-label={option.label}>
                  {option.value}
                  </span>
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
