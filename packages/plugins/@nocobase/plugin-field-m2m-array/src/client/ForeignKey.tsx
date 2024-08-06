/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField } from '@formily/react';
import { AutoComplete, Select } from 'antd';
import React, { useState, useEffect } from 'react';
import { useRecord, useCompile } from '@nocobase/client';
import { useMBMFields } from './hooks';

export const ForeignKey = observer(
  (props: any) => {
    const { disabled } = props;
    const [options, setOptions] = useState([]);
    const record = useRecord();
    const field: any = useField();
    const { type, template } = record;
    const value = record[field.props.name];
    const compile = useCompile();
    const [initialValue, setInitialValue] = useState(value || (template === 'view' ? null : field.initialValue));
    const { foreignKeys } = useMBMFields();
    useEffect(() => {
      const fields = foreignKeys;
      if (fields) {
        const sourceOptions = fields.map((k) => {
          return {
            value: k.name,
            label: compile(k.uiSchema?.title || k.name),
          };
        });
        setOptions(sourceOptions);
        if (value) {
          const option = sourceOptions.find((v) => v.value === value);
          setInitialValue(option?.label || value);
        }
      }
    }, [type]);
    const Component = template === 'view' ? Select : AutoComplete;
    return (
      <div>
        <Component
          disabled={disabled}
          value={initialValue}
          options={options}
          showSearch
          onDropdownVisibleChange={async (open) => {
            const fields = foreignKeys;
            if (fields && open) {
              setOptions(
                fields.map((k) => {
                  return {
                    value: k.name,
                    label: compile(k.uiSchema?.title || k.name),
                  };
                }),
              );
            }
          }}
          onChange={(value, option) => {
            props?.onChange?.(value);
            setInitialValue(option.label || value);
          }}
        />
      </div>
    );
  },
  { displayName: 'MBMForeignKey' },
);
