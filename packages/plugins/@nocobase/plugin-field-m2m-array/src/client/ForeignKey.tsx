/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useField } from '@formily/react';
import { Select, AutoComplete } from 'antd';
import React, { useState, useEffect } from 'react';
import { useRecord, useCompile, useCollectionManager_deprecated } from '@nocobase/client';

const supportTypes = ['array'];
export const ForeignKey = observer(
  (props: any) => {
    const { disabled } = props;
    const [options, setOptions] = useState([]);
    const { getCollection } = useCollectionManager_deprecated();
    const record = useRecord();
    const field: any = useField();
    const { collectionName, type, name, template } = record;
    const value = record[field.props.name];
    const compile = useCompile();
    const [initialValue, setInitialValue] = useState(value || (template === 'view' ? null : field.initialValue));
    useEffect(() => {
      const effectField = collectionName;
      const fields = getCollection(effectField)?.fields;
      if (fields) {
        const sourceOptions = fields
          ?.filter((v) => {
            return supportTypes.includes(v.type);
          })
          .map((k) => {
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
    const Compoent = template === 'view' ? Select : AutoComplete;
    return (
      <div>
        <Compoent
          disabled={disabled}
          value={initialValue}
          options={options}
          showSearch
          onDropdownVisibleChange={async (open) => {
            const effectField = collectionName || name;
            if (effectField && open) {
              const fields = getCollection(effectField)?.fields || [];
              setOptions(
                fields
                  ?.filter((v) => {
                    return supportTypes.includes(v.type);
                  })
                  .map((k) => {
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
  { displayName: 'ForeignKey' },
);
