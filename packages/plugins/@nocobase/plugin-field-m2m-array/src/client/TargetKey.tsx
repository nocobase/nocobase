/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Select } from 'antd';
import { observer, useField } from '@formily/react';
import { useRecord, useCompile } from '@nocobase/client';
import { useMBMFields } from './hooks';

export const TargetKey = observer(
  (props: any) => {
    const { value, disabled } = props;
    const { targetKey } = useRecord();
    const [options, setOptions] = useState([]);
    const [initialValue, setInitialValue] = useState(value || targetKey);
    const compile = useCompile();
    const field: any = useField();
    field.required = true;
    const { targetKeys } = useMBMFields();
    useEffect(() => {
      if (targetKeys) {
        setOptions(
          targetKeys.map((k) => {
            return {
              value: k.name,
              label: compile(k?.uiSchema?.title || k.title || k.name),
            };
          }),
        );
      }
    }, [targetKeys]);
    return (
      <div>
        <Select
          showSearch
          options={options}
          onDropdownVisibleChange={async (open) => {
            if (targetKeys && open) {
              setOptions(
                targetKeys.map((k) => {
                  return {
                    value: k.name,
                    label: compile(k?.uiSchema?.title || k.title || k.name),
                  };
                }),
              );
            }
          }}
          onChange={(value) => {
            props?.onChange?.(value);
            setInitialValue(value);
          }}
          value={initialValue}
          disabled={disabled}
        />
      </div>
    );
  },
  { displayName: 'MBMTargetKey' },
);
