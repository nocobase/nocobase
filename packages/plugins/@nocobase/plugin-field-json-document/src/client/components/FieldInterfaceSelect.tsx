/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useEffect, useState } from 'react';
import { observer } from '@formily/react';
import { useCollectionRecord, useCompile } from '@nocobase/client';
import { useFieldInterfaceManager, useFieldInterfaceOptions } from '../field-interface-manager';
import { Select } from 'antd';
import { JSONDocFieldsContext } from './JSONDocFieldsProvider';

export const FieldInterfaceSelect = observer(
  (props: any) => {
    const { value } = props;
    const { updateByOption } = useContext(JSONDocFieldsContext);
    const { data: record } = useCollectionRecord() as any;
    const { getInterface } = useFieldInterfaceManager();
    const compile = useCompile();
    const options = useFieldInterfaceOptions();
    const [selectValue, setSelectValue] = useState(value);

    return (
      <Select
        aria-label={`field-interface-${record?.type}`}
        //@ts-ignore
        role="button"
        value={selectValue}
        style={{ width: '100%' }}
        popupMatchSelectWidth={false}
        onChange={(value) => {
          const interfaceConfig = getInterface(value);
          updateByOption(record.key, 'interface', value);
          updateByOption(record.key, 'uiSchema', {
            title: record?.uiSchema?.title,
            ...interfaceConfig?.default?.uiSchema,
          });
          setSelectValue(value);
        }}
      >
        {options.map((group, index) => (
          <Select.OptGroup key={index} label={compile(group.label)}>
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
  { displayName: 'JSONDocFieldInterfaceSelect' },
);
