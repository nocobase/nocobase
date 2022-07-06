import React from "react";
import { Cascader } from 'antd';
import { useTranslation } from 'react-i18next';

import { useCollectionFilterOptions, useCompile } from "@nocobase/client";



export default function (props) {
  const { collection, value, onChange } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const fields = useCollectionFilterOptions(collection);

  return (
    <Cascader
      fieldNames={{
        label: 'title',
        value: 'name',
        children: 'children',
      }}
      changeOnSelect={false}
      value={Array.isArray(value) ? value : value?.split('.')}
      options={compile(fields)}
      onChange={onChange}
      placeholder={t('Select Field')}
    />
  );
}
