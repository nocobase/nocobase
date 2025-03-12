/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import React, { useCallback, useMemo } from 'react';
import { Select } from 'antd';

import { DynamicComponent } from './DynamicComponent';

export type InputModeType = 'constant' | 'express' | 'empty';
interface ValueDynamicComponentProps {
  fieldValue: any;
  schema: any;
  setValue: (value: any) => void;
  collectionName: string;
  inputModes?: Array<InputModeType>;
}

export const OptionsComponent = (props: ValueDynamicComponentProps) => {
  const { fieldValue, setValue, schema } = props;
  const handleChangeOfConstant = useCallback(
    (value) => {
      setValue({
        value,
      });
    },
    [setValue],
  );

  return (
    <Select
      style={{ minWidth: 200, maxWidth: 500 }}
      onChange={handleChangeOfConstant}
      value={fieldValue?.value}
      mode="multiple"
      options={schema?.enum || []}
    />
  );
};
