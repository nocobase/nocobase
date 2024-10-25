/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer } from '@formily/react';
import { Input } from 'antd';
import React, { useState, useEffect, useContext } from 'react';
import { useRecord } from '@nocobase/client';
import { JSONDocFieldsContext } from './JSONDocFieldsProvider';

export const FieldTitleInput = observer(
  (props: any) => {
    const { value } = props;
    const { updateByOption } = useContext(JSONDocFieldsContext);
    const record = useRecord();
    const [titleValue, setTitleValue] = useState(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setTitleValue(newValue);
      updateByOption(record.key, 'title', newValue);
    };
    useEffect(() => {
      setTitleValue(value);
    }, [value]);

    return (
      <Input value={titleValue} onChange={handleChange} style={{ minWidth: '100px' }} aria-label="field-title-input" />
    );
  },
  { displayName: 'JSONDocFieldTitleInput' },
);
