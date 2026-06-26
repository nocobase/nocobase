/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, useFlowSettingsContext } from '@nocobase/flow-engine';
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import React, { useMemo } from 'react';

import { useT } from '../../locale';
import { getCollectionFieldOptions, getCommentOwnerFieldOptions, getCommentUserFieldOptions } from '../utils';

type RecordCommentFieldSelectProps = Omit<SelectProps<string | string[]>, 'options'> & {
  value?: string | string[];
  onChange?: (value: string | string[] | undefined) => void;
  fieldFilter?: 'belongsTo' | 'user';
};

export const RecordCommentFieldSelect = observer((props: RecordCommentFieldSelectProps) => {
  const { value, onChange, fieldFilter, ...others } = props;
  const t = useT();
  const settingsContext = useFlowSettingsContext();
  const model = settingsContext?.model as { collection?: unknown } | undefined;
  const collection = model?.collection || settingsContext?.collection;
  const options = useMemo(() => {
    if (fieldFilter === 'belongsTo') {
      return getCommentOwnerFieldOptions(collection);
    }

    if (fieldFilter === 'user') {
      return getCommentUserFieldOptions(collection);
    }

    return getCollectionFieldOptions(collection);
  }, [collection, fieldFilter]);

  return (
    <Select
      {...others}
      showSearch
      allowClear
      optionFilterProp="label"
      placeholder={t('Select field')}
      style={{ width: '100%' }}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
});
