/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useForm, useField } from '@formily/react';
import { Select, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  useCompile,
  useCollectionManager_deprecated,
  useFieldInterfaceOptions,
  useCollectionRecord,
} from '@nocobase/client';

const getInterfaceOptions = (data, type) => {
  const interfaceOptions = [];
  data.forEach((item) => {
    const options = item.children.filter((h) => h?.availableTypes?.includes(type));
    interfaceOptions.push({
      label: item.label,
      key: item.key,
      children: options,
    });
  });
  return interfaceOptions.filter((v) => {
    if (type === 'sort') {
      return v.key === 'advanced';
    }
    return v.children.length > 0;
  });
};
const isValueInOptions = (value, options) => {
  return options?.some((option) => option.children?.some?.((child) => child.name === value));
};
export const CollectionFieldInterfaceSelect = observer(
  (props: any) => {
    const { value, handleFieldChange } = props;
    const { data: record } = useCollectionRecord() as any;
    const { getInterface } = useCollectionManager_deprecated();
    const compile = useCompile();
    const initOptions = useFieldInterfaceOptions();
    const data = getInterfaceOptions(initOptions, record.type);
    const [selectValue, setSelectValue] = useState(value);
    const [options, setOptions] = useState(data);
    const targetType = record.type;
    useEffect(() => {
      //只有一个选项的时候选中该选项
      if (options.length === 1 && options[0]?.children?.length === 1) {
        const targetValue = options[0]?.children?.[0]?.name;
        if (targetValue !== selectValue) {
          const interfaceConfig = getInterface(targetValue);
          handleFieldChange(
            {
              interface: targetValue,
              uiSchema: { title: record?.uiSchema?.title, ...interfaceConfig?.default?.uiSchema },
            },
            record.name,
            false,
          );
          setSelectValue(targetValue);
        }
        //选中的值不在选项中切换为第一个
      } else if (selectValue && !isValueInOptions(selectValue, options)) {
        const targetValue = options[0]?.children?.[0]?.name;
        const interfaceConfig = getInterface(targetValue);
        handleFieldChange(
          {
            interface: targetValue,
            uiSchema: { title: record?.uiSchema?.title, ...interfaceConfig?.default?.uiSchema },
          },
          record.name,
          false,
        );
        setSelectValue(targetValue);
      }
    }, [options]);

    useEffect(() => {
      if (record?.possibleTypes) {
        const newOptions = getInterfaceOptions(initOptions, targetType);
        setOptions(newOptions);
      }
    }, [targetType]);
    return ['oho', 'obo', 'o2m', 'm2o', 'm2m'].includes(record.interface) ? (
      <Tag key={value}>
        {compile(initOptions.find((h) => h.key === 'relation')['children'].find((v) => v.name === value)?.['label'])}
      </Tag>
    ) : (
      <Select
        aria-label={`field-interface-${record?.type}`}
        //@ts-ignore
        role="button"
        value={selectValue}
        style={{ width: '100%' }}
        popupMatchSelectWidth={false}
        onChange={(value) => {
          const interfaceConfig = getInterface(value);
          handleFieldChange(
            {
              interface: value,
              uiSchema: { title: record?.uiSchema?.title, ...interfaceConfig?.default?.uiSchema },
            },
            record.name,
          );
          setSelectValue(value);
        }}
      >
        {options.map((group) => (
          <Select.OptGroup key={group.key} label={compile(group.label)}>
            {group.children.map((item) => (
              <Select.Option key={item.name} value={item.name}>
                {compile(item.label)}
              </Select.Option>
            ))}
          </Select.OptGroup>
        ))}
      </Select>
    );
  },
  { displayName: 'CollectionFieldInterfaceSelect' },
);
