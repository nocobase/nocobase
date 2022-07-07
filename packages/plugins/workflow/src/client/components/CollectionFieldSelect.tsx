import React from "react";
import { Select, Cascader } from 'antd';
import { useTranslation } from 'react-i18next';

import { useCollectionManager, useCollectionFilterOptions, useCompile } from "@nocobase/client";



export default function (props) {
  const { collection, value, onChange } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const fields = getCollectionFields(collection)
    .filter(field => field.interface && (!field.target || field.type === 'belongsTo'))
    .map(field => field.type === 'belongsTo'
      ? {
        title: `${compile(field.uiSchema?.title || field.name)} ID`,
        name: field.foreignKey
      }
      : {
        title: compile(field.uiSchema?.title || field.name),
        name: field.name
      });

  return (
    <Select
      placeholder={t('Fields')}
      value={value}
      onChange={onChange}
    >
      {fields
        .map(field => (
          <Select.Option key={field.name} value={field.name}>{field.title}</Select.Option>
        ))
      }
    </Select>
  );
}


function SelectWithAssociations(props) {
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
