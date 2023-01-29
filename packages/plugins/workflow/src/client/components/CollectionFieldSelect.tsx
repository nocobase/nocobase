import React from "react";
import { Select, Cascader } from 'antd';
import { useTranslation } from 'react-i18next';

import { useCollectionManager, useCollectionFilterOptions, useCompile } from "@nocobase/client";
import { filterTypedFields, useOperandContext } from "../variable";



export default function (props) {
  const { collection, fields, value, onChange } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const { types } = useOperandContext();
  const availableFields = filterTypedFields((fields ?? getCollectionFields(collection)), types)
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
      {availableFields
        .map(field => (
          <Select.Option key={field.name} value={field.name}>{field.title}</Select.Option>
        ))
      }
    </Select>
  );
}

export function useCollectionFieldOptions(props) {
  const { fields, collection, types } = props;
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  return filterTypedFields((fields ?? getCollectionFields(collection)), types)
    .filter(field => field.interface && (!field.target || field.type === 'belongsTo'))
    .map(field => field.type === 'belongsTo'
      ? {
        label: `${compile(field.uiSchema?.title || field.name)} ID`,
        key: field.foreignKey,
        value: field.foreignKey,
      }
      : {
        label: compile(field.uiSchema?.title || field.name),
        key: field.name,
        value: field.name,
      });
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
